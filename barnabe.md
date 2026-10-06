Étape 1 : Vue d'ensemble

À quoi sert le projet ?

Transcendance est un jeu de Tock en ligne. Le Tock est un jeu de plateau à 4 joueurs, proche des « petits chevaux », sauf qu'on avance ses pions avec des cartes à jouer au lieu d'un dé. Le but : ramener ses 4 pions dans sa « maison ».

En plus du jeu, le site gère :
- les comptes (inscription, connexion, profil avec avatar),
- une liste d'amis avec leur présence en ligne,
- des parties privées qu'on rejoint avec un code d'invitation,
- un chat pendant la partie.
moment-là.
  2. Explique le rôle de ces fichiers, puis les parties importantes du code (pas ligne par ligne, sauf si c'est crucial).
  3. Montre comment ils s'articulent avec ce qu'on a déjà vu (qui appelle qui, quelles données circulent).
  4. Récapitule en 3 à 5 points clés.
  5. Termine par une question de vérification simple pour m'aider à valider ma
  compréhension, puis demande sidir ou reformuler.

  Règles d'explication

  - Définis chaque terme technique ou acronyme à sa première apparition, en une phrase simple.
  - Utilise des analogies concrètes quand un concept est abstrait.
  - Cite toujours le chemin du fichier concerné (ex : src/server/handler.cpp) pour que je
  puisse suivre.
  - Ne montre que les extraits de code nécessaires, avec des commentaires clairs.
  - Si un sujet est trop avancé ésume-le en deux phrases plutôt que de t'y perdre.
  - Si tu n'es pas sûr d'une intclairement au lieu d'inventer.
  - Réponds en français.

  Pour finir

  Quand on aura couvert tout le projet, fais-moi un récapitulatif global : le parcours
  d'une requête/donnée de bout eprojet et ses éventuellesfaiblesses ou zones floues.

  Commence par l'étape 0 et l'ét

  Ran 4 shell commands

Bonne nouvelle pour commencer : le dépôt a un README.md très complet (en français). On pourra s'appuyer dessus. Attention quand même, il est en partie périmé : il ne parle ni
des amis, ni du chat, et l'orgontend a changé depuis. Quand le README et le code ne disent pas la même chose, je te le signalerai.

---

Étape 1 : Vue d'ensemble

À quoi sert le projet ?

Transcendance est un jeu de Tock en ligne. Le Tock est un jeu de plateau à 4 joueurs, proche des « petits chevaux », sauf qu'on avance ses pions avec des cartes à jouer au lieu d'un dé. Le but : ramener ses 4 pions dans sa « maison ».

En plus du jeu, le site gère :
- les comptes (inscription, connexion, profil avec avatar),
- une liste d'amis avec leur présence en ligne,
- des parties privées qu'on rejoint avec un code d'invitation,
- un chat pendant la partie.

Les places vides sont prises par des IA. Pour l'instant, elles jouent un coup légal au hasard.

▎ Analogie : imagine un club de jeux de société. Le portier (nginx) accueille tout le monde à l'entrée et oriente chacun. La salle (frontend) contient les tables et les plateaux que tu vois. L'arbitre (backend) connaît les règles et décide si ton coup est valide. Le registre (base de données) garde la liste des membres et l'historique des
▎ parties. Toi, tu ne touches u : tu dis à l'arbitre « je joue ce 7 sur ce pion », et c'est lui qui déplace la pièce.

Les technologies, et pourquoi

Tout le code est en TypeScript, c'est-à-dire du JavaScript auquel on ajoute des types (on déclare « cette variable est un nombre »). Ça permet de détecter beaucoup d'erreurs avant même d'exécuter le code.

Techno: Next.js (avec React)
Rôle dans le projet: Le frontend, c'est-à-dire ce qui s'affiche dans ton navigateur. React
construit l'interface en petits blocs réutilisables appelés composants. Next.js organise
ces blocs en pages.
──────────────────────────────
Techno: Tailwind / shadcn/ui / motion
Rôle dans le projet: Le style et les animations : Tailwind pour les classes CSS, shadcn
pour des boutons et champs déjles pions et les cartes.
────────────────────────────────────────
Techno: NestJS
Rôle dans le projet: Le backend, le programme serveur qui contient la logique. C'est un
framework (une structure imposules bien séparés.
────────────────────────────────────────
Techno: Socket.io (WebSocket)
Rôle dans le projet: La communebSocket est une connexion qui
reste ouverte, comme un appel téléphonique, alors qu'une requête HTTP classique ressemble
 plutôt à une lettre envoyée puis répondue. Le serveur peut ainsi prévenir tous les
joueurs dès qu'un coup est joué.
────────────────────────────────────────
Techno: PostgreSQL
Rôle dans le projet: La base de données, où sont stockés les utilisateurs, profils,
amitiés
et parties.
──────────────────────────────
Techno: Prisma
Rôle dans le projet: Un ORM : un traducteur qui permet de manipuler la base avec du code
TypeScript (prisma.user.findUndu SQL.
────────────────────────────────────────
Techno: JWT + bcrypt
Rôle dans le projet: La sécurisigné que le serveur te remet à
la connexion, rangé dans un cookie. bcrypt transforme les mots de passe en empreinte
illisible (hash) avant de les stocker.
──────────────────────────────
Techno: nginx
Rôle dans le projet: Un reverse proxy : la porte d'entrée unique, qui gère le HTTPS et
redirige chaque requête vers le bon service.
──────────────────────────────
Techno: Docker Compose
Rôle dans le projet: Lance lesnd, backend, postgres), chacun
dans sa petite machine isolée (conteneur), avec une seule commande.

L'arborescence

Transcendance/
├── docker-compose.yml   → la « recette » qui lance les 4 conteneurs
├── nginx/               → la porte d'entrée (HTTPS + aiguillage des URL)
├── backend/             → le serveur NestJS (l'arbitre)
│   ├── prisma/          →   schéma de la base + historique de ses modifications (migrations)
│   └── src/
│       ├── main.ts      →   point de départ du serveur
│       ├── auth/        →   inscription, connexion, badges JWT
│       ├── profile/     →   profil et avatar
│       ├── friends/     →   amis + présence en ligne
│       ├── prisma/      →   connexion à la base
│       └── game/        →   les parties
│           └── engine/  →   les RÈGLES du Tock (le cœur du projet)
├── frontend/            →   le site Next.js (la salle de jeu)
│   ├── public/          →   images (cartes, démons, logo)
│   └── src/
│       ├── pages/       →   une page = une URL (/login, /lobby, /play…)
│       ├── components/  →   morceaux d'interface (plateau, cartes, formulaires…)
│       ├── hooks/       →   logique réutilisable côté React (useGame, useChat…)
│       ├── sockets/     →   connexion WebSocket au serveur
│       ├── api/         →   appels HTTP vers le backend
│       └── lib/         →   utilitaires (géométrie du plateau, types du jeu…)
├── presentation/, slides/ → supports de soutenance (pas du code applicatif)
└── docs/                → notes personnelles (memo TypeScript)

Pour comprendre le projet, on /.agents, .claude et .windsurf.Ce sont des fichiers générés automatiquement ou des fichiers de configuration d'outils d'IA.

Schéma de l'architecture

Navigateur  (https://localhost:8443)
                         │
                         ▼
                ┌──────────────────┐
                │      nginx       │  aiguillage selon le début de l'URL
                └──────────────────┘
          "/"  │          "/api/" │          "/ws/" │
       (pages) │      (HTTP)      │   (WebSocket)   │
               ▼                  └────────┬────────┘
      ┌─────────────────┐                  ▼
      │    frontend     │       ┌─────────────────────────┐
      │ Next.js + React │       │    backend (NestJS)     │
      └─────────────────┘       │  auth · profile ·       │
                                │  friends · game         │
                                │           │             │
                                │      engine/ (règles,   │
                                │      code « pur »)      │
                                └────────────┬────────────┘
                                             │ Prisma
                                             ▼
                                      ┌────────────┐
                                      │ PostgreSQL │
                                      └────────────┘
Deux idées clés à garder en tête dès maintenant :
1. Le serveur fait autorité. Le frontend n'applique aucune règle du jeu. Il envoie une intention (« je joue telle carte sur tel pion »), et c'est le backend qui valide ou refuse.
2. Une partie en cours vit en  dans la base de données. Labase ne garde que ce qui doit durer.

---

Plan de lecture proposé

#: 2
Étape: L'infrastructure
Fichiers principaux: docker-compose.yml, nginx/nginx.conf
Pourquoi à ce moment-là: Comprendre comment les 4 morceaux sont lancés et reliés.
────────────────────────────────────────
#: 3
Étape: Le démarrage du backend
Fichiers principaux: backend/s
Pourquoi à ce moment-là: Voir le point d'entrée et le vocabulaire NestJS (module,
controller, service).
────────────────────────────────────────
#: 4
Étape: La base de données
Fichiers principaux: backend/prisma/schema.prisma, prisma.service.ts
Pourquoi à ce moment-là: Savoivant de voir qui les manipule.
────────────────────────────────────────
#: 5
Étape: L'authentification
Fichiers principaux: auth/auth.controller.ts, auth.service.ts (+ guard, cookies)
Pourquoi à ce moment-là: Tout le reste du site en dépend.
────────────────────────────────────────
#: 6
Étape: Le modèle du jeu
Fichiers principaux: game/game.types.ts, engine/board.ts, engine/deck.ts
Pourquoi à ce moment-là: Le voses, cartes, actions.
────────────────────────────────────────
#: 7
Étape: Les règles
Fichiers principaux: engine/ru.ts, state.ts
Pourquoi à ce moment-là: Le cœur du projet : comment un coup est validé puis appliqué.
────────────────────────────────────────
#: 8
Étape: Le service de jeu
Fichiers principaux: game/game.service.ts, game.controller.ts
Pourquoi à ce moment-là: Création et lancement des parties, la fonction commit, les bots.
────────────────────────────────────────
#: 9
Étape: Le temps réel
Fichiers principaux: game/game
Pourquoi à ce moment-là: Comment l'état de la partie est envoyé à chaque joueur.
──────────────────────────────
#: 10
Étape: Le frontend : structure et connexion
Fichiers principaux: pages/, a
Pourquoi à ce moment-là: Le côté navigateur : pages, appels HTTP, WebSocket.
────────────────────────────────────────
#: 11
Étape: Le frontend : l'écran de jeu
Fichiers principaux: hooks/useages/play.tsx
Pourquoi à ce moment-là: Comment un clic devient une action, puis une animation.
──────────────────────────────
#: 12
Étape: Les fonctions annexes
Fichiers principaux: friends/, chat, profile/
Pourquoi à ce moment-là: Amis, présence, chat, avatar : une fois le reste compris, ça ira
vite.
────────────────────────────────────────
#: 13
Étape: Récapitulatif global
Fichiers principaux: —
Pourquoi à ce moment-là: Le trajet d'un coup de bout en bout, les points forts et les
faiblesses.

Tu valides ce plan ? Tu peux aussi le modifier, par exemple sauter l'infrastructure (étape 2) pour aller plus vite au jeu, ou commencer directement par le frontend si c'est la partie qui t'intéresse le plus.