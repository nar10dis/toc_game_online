Étape 5 : L'authentification

Ce qu'on regarde, et pourquoi maintenant

Deux fichiers principaux : backend/src/auth/auth.controller.ts (les routes) et backend/src/auth/auth.service.ts (le travail), plus un petit fichier guards/jwt-auth.guard.ts (le vigile). Presque toutes les autres routes du projet exigent d'être connecté, donc il faut comprendre ce mécanisme avant d'attaquer le jeu.

Authentifier, c'est répondre à la question « qui es-tu ? ».

1. Le problème à résoudre

HTTP n'a pas de mémoire : chaque requête arrive au serveur comme si c'était la première. Sans rien faire, il faudrait renvoyer son mot de passe à chaque clic.

La solution utilisée ici : à la connexion, le serveur te remet un badge. Ensuite, ton navigateur présente ce badge à chaque requête.

▎ Analogie : un festival. À l'entrée, tu montres ta pièce d'identité (email + mot de passe) et on te met un bracelet. Ensuite, les vigiles regardent seulement le bracelet. Ils n'ont pas besoin de rappeler l'accueil pour vérifier : le bracelet est infalsifiable.

2. Les trois outils

Le hash (bcrypt). Un hash est une empreinte calculée à partir d'un texte, impossible à inverser. Le mot de passe chaton123 devient une suite illisible du type $2b$10$N9qo8uLO.... On stocke l'empreinte, jamais le mot de passe. Pour vérifier une connexion, on recalcule l'empreinte de ce que l'utilisateur tape et on compare. Si la base est volée, les mots de passe ne sont pas lisibles.

Le JWT (JSON Web Token). C'est le bracelet. Il contient trois parties :

[ en-tête ] . [ contenu : { sub: 5, username: "alice" } ] . [ signature ]

Le contenu (appelé payload) dit qui tu es : sub est le numéro de l'utilisateur. La signature est calculée avec une clé secrète connue du seul serveur (JWT_SECRET). Si quelqu'un modifie le contenu pour se faire passer pour un autre, la signature ne correspond plus et le serveur refuse le badge.

Le cookie. Un cookie est une petite donnée que le serveur demande au navigateur de conserver, et que le navigateur renvoie automatiquement à chaque requête vers le même site. C'est là qu'on range le JWT. On comprend maintenant pourquoi nginx met tout sous la même adresse (étape 2) : le cookie accompagne ainsi toutes les requêtes, y compris la WebSocket.

3. Les routes

Toutes dans auth.controller.ts, sous @Controller('auth') :

┌──────────────────────────┬────────────────────────────────────────────────────────┐
│          Route           │                          Rôle                          │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ POST /api/auth/register  │ créer un compte                                        │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ POST /api/auth/login     │ se connecter : reçoit les deux cookies                 │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ POST /api/auth/refresh   │ obtenir un nouveau badge sans retaper son mot de passe │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ PATCH /api/auth/password │ changer de mot de passe (connecté)                     │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ POST /api/auth/logout    │ se déconnecter (connecté)                              │
└──────────────────────────┴────────────────────────────────────────────────────────┘

4. L'inscription

Dans auth.service.ts :

async register(data: RegisterDTO) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(data.password, salt);   // 1. hasher le mot de passe
    return this.prisma.user.create({                               // 2. créer la ligne dans User
        data: {
            ...data,                     // email et name tels quels
            password: hashPassword,      // mais le mot de passe est remplacé par son hash
            profile: { create: {} },     // 3. et créer un Profile vide, relié à ce user
        },
    });
}

Deux notations nouvelles :

- ...data (les trois points) : « recopie ici tout ce que contient data ». Ça évite d'écrire email: data.email, name: data.name.
- RegisterDTO : un DTO (Data Transfer Object) est simplement la description de la forme des données attendues. Ici : email, name, password.

Le sel (salt) est un ingrédient aléatoire ajouté avant le hash, pour que deux utilisateurs ayant le même mot de passe n'aient pas la même empreinte.

5. La connexion

Côté service :

async login(data) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user)
        throw new UnauthorizedException();              // email inconnu → erreur 401

    const password_comp = await bcrypt.compare(data.password, user.password);
    if (!password_comp)
        throw new UnauthorizedException();              // mauvais mot de passe → erreur 401

    return this.createSession(user.id, user.name);      // tout est bon : fabriquer les badges
}

throw interrompt la fonction et renvoie une erreur. 401 est le code HTTP qui signifie « non authentifié ». Le ! devant une valeur veut dire « n'existe pas » ou « est faux ».

Puis le controller range les badges dans des cookies :

const { access_token, refresh_token } = await this.authService.login(data);
res.cookie('jwt', access_token, ACCESS_COOKIE_OPTIONS);
res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);

Les options, définies dans backend/src/auth/cookies.ts, sont trois protections :

┌──────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
│      Option      │                                          Effet                                           │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ httpOnly         │ le JavaScript de la page ne peut pas lire le cookie, donc un script malveillant ne peut  │
│                  │ pas le voler                                                                             │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ secure           │ le cookie ne circule qu'en HTTPS                                                         │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ sameSite:        │ le cookie n'est pas envoyé si la requête vient d'un autre site                           │
│ 'strict'         │                                                                                          │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────────────────┘

6. Pourquoi deux badges ?

┌───────────────┬──────────────────────────────────────┬──────────────────────────────────────────────────┐
│               │          jwt (access token)          │                  refresh_token                   │
├───────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Durée de vie  │ 15 minutes                           │ 7 jours                                          │
├───────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Sert à        │ prouver qui on est, à chaque requête │ obtenir un nouvel access token                   │
├───────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Trace en base │ aucune                               │ son hash est stocké dans User.hashedRefreshToken │
└───────────────┴──────────────────────────────────────┴──────────────────────────────────────────────────┘

C'est un compromis. Si le badge court est volé, il ne sert que 15 minutes. Le badge long sert rarement, et comme son empreinte est en base, le serveur peut l'annuler : c'est ce que fait logout, qui met hashedRefreshToken à vide.

La fonction refresh vérifie trois choses avant de donner de nouveaux badges : la signature est valide, l'utilisateur existe, et le hash du badge présenté est bien celui enregistré en base. À chaque refresh, le badge long est lui aussi remplacé. Un ancien badge ne peut donc plus resservir.

7. Le vigile : AuthGuard

backend/src/auth/guards/jwt-auth.guard.ts, c'est lui qu'on a croisé à l'étape 3 avec @UseGuards(AuthGuard) :

canActivate(context) {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies['jwt'];              // 1. lire le cookie (merci cookieParser)
    if (!token)
        throw new UnauthorizedException();         //    pas de badge → 401
    try {
        req.user = this.jwtService.verify(token);  // 2. vérifier signature et date d'expiration
    }                                              //    et noter le contenu dans req.user
    catch {
        throw new UnauthorizedException();         //    badge faux ou expiré → 401
    }
    return true;                                   // 3. laisser passer
}

La ligne importante est req.user = .... Le guard accroche l'identité à la requête. C'est pour ça que dans game.controller.ts on lisait user.sub : c'est le numéro du joueur, extrait du badge. Le serveur ne fait jamais confiance à un « je suis l'utilisateur 5 » envoyé par le navigateur, il le lit dans le badge signé.

try { ... } catch { ... } veut dire « essaie ceci, et si ça échoue, fais cela ».

8. Comment ça s'articule

1. LOGIN
   navigateur ── email + mot de passe ──▶ AuthController ──▶ AuthService ──▶ base
   navigateur ◀── 2 cookies (jwt 15 min, refresh_token 7 j) ──┘

2. REQUÊTE NORMALE (ex : créer une partie)
   navigateur ── cookie jwt ──▶ AuthGuard ── req.user = {sub, username} ──▶ GameController

3. BADGE EXPIRÉ
   navigateur ── cookie jwt périmé ──▶ AuthGuard ──▶ 401
   navigateur ── POST /api/auth/refresh (cookie refresh_token) ──▶ nouveaux cookies
   navigateur ── rejoue la requête de départ ──▶ ça passe

Le point 3 est automatisé côté navigateur dans frontend/src/api/auth.ts, par la fonction fetchWithRefresh : sur un 401, elle demande un refresh puis réessaie. L'utilisateur ne voit rien.

9. Une faiblesse repérée

Les données d'inscription ne sont pas contrôlées. RegisterDTO décrit la forme attendue mais rien ne la vérifie, et ...data recopie tout ce que le navigateur envoie directement vers la base. Il n'y a par exemple aucune longueur minimale de mot de passe à l'inscription, alors que changePassword en impose une de 8 caractères. On le notera pour le bilan final.

Points clés

1. Le mot de passe n'est jamais stocké : seule son empreinte bcrypt l'est.
2. À la connexion, le serveur remet un JWT signé rangé dans un cookie, que le navigateur renvoie tout seul à chaque requête.
3. Deux badges : un court (15 min) pour les requêtes, un long (7 jours) pour renouveler le court, et qui peut être annulé.
4. AuthGuard vérifie le badge et écrit l'identité dans req.user. Les controllers y lisent user.sub.
5. Sur une erreur 401, le frontend fait un refresh et réessaie automatiquement.

Question de vérification

Alice est connectée et joue depuis 20 minutes sans s'être reconnectée. Elle clique sur « créer une partie ». Son cookie jwt date de sa connexion. Que se passe-t-il, étape par étape, entre son clic et la création de la partie ?

Ensuite, dis-moi si on continue vers l'étape 6 (le modèle du jeu : types, plateau, cartes), si tu veux approfondir ou que je reformule.