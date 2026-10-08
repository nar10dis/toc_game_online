# Transcendence — jeu de Tock en ligne

Un jeu de plateau à 4 joueurs (Tock : pions, cartes, maisons) jouable dans le navigateur.
Les places vides sont prises par des IA, et la partie se joue en temps réel grâce aux WebSockets.

| Couche | Techno |
|---|---|
| Frontend | Next.js 16 (Pages Router), React 19, Tailwind 4, shadcn/ui, motion, socket.io-client |
| Backend | NestJS 11, socket.io, JWT en cookies, bcrypt |
| Base de données | PostgreSQL 18 via Prisma 7 (adapter `pg`) |
| Reverse proxy | nginx (HTTPS, certificat auto-signé) |
| Orchestration | Docker Compose |

---

## Sommaire

1. [Lancer le projet](#1-lancer-le-projet)
2. [Vue d'ensemble de l'architecture](#2-vue-densemble-de-larchitecture)
3. [Arborescence](#3-arborescence)
4. [Backend](#4-backend)
5. [Le moteur de jeu (`engine/`)](#5-le-moteur-de-jeu-engine)
6. [Temps réel : WebSockets](#6-temps-réel--websockets)
7. [Frontend](#7-frontend)
8. [Identité visuelle et design system](#8-identité-visuelle-et-design-system)
9. [Base de données (Prisma)](#9-base-de-données-prisma)
10. [État du projet / reste à faire](#10-état-du-projet--reste-à-faire)
11. [Gestion des erreurs et logs](#11-gestion-des-erreurs-et-logs)

---

## 1. Lancer le projet

### Prérequis
- Docker + Docker Compose
- Deux fichiers d'environnement (non fournis, à créer) :

| Fichier | Variables | Utilisé par |
|---|---|---|
| `.env` (racine) | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | postgres, frontend, nginx |
| `backend/.env` | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (+ `PORT`, optionnel, 3001 par défaut) | backend |

Exemple de `DATABASE_URL` : `postgresql://<user>:<password>@postgres:5432/<db>`. L'hôte est `postgres`, le nom du service Docker.

### Démarrer

```bash
docker compose up --build      # premier lancement
docker compose up -d           # en arrière-plan
docker compose logs -f backend # suivre les logs d'un service
docker compose down            # tout arrêter (les données restent dans le volume db_data)
```

Ensuite, ouvrir **https://localhost:8443**. Le navigateur affiche un avertissement : le certificat est auto-signé, il faut l'accepter.

Au démarrage, le backend applique automatiquement les migrations (`prisma migrate deploy`), génère le client Prisma et démarre en mode watch. Les dossiers `backend/` et `frontend/` sont montés en volume : le code se recharge à chaud, pas besoin de rebuild à chaque modif.

---

## 2. Vue d'ensemble de l'architecture

```
                              navigateur
                                  │
                                  │  https://localhost:8443
                                  ▼
                   ┌──────────────────────────────┐
                   │            nginx             │
                   │  TLS, point d'entrée unique  │
                   └──────────────────────────────┘
                      │            │            │
      URL qui commence par :       │            │
                      │            │            │
                    "/"         "/api/"       "/ws/"
                  (pages)       (HTTP)     (WebSocket)
                      │            │            │
                      ▼            └─────┬──────┘
         ┌──────────────────┐            ▼
         │     frontend     │  ┌──────────────────────────────┐
         │  Next.js  :3000  │  │           backend            │
         └──────────────────┘  │         NestJS :3001         │
                               │                              │
                               │  AuthModule    (HTTP)        │
                               │  ProfileModule (HTTP)        │
                               │  GameModule    (HTTP + WS)   │
                               │     └── engine/ (pur, sans   │
                               │         Nest ni BDD)         │
                               └──────────────┬───────────────┘
                                              │ Prisma
                                              ▼
                                     ┌─────────────────┐
                                     │   PostgreSQL    │
                                     └─────────────────┘
```

nginx regarde le début de l'URL demandée et envoie la requête au bon conteneur (`nginx/nginx.conf`) :

| URL demandée | Envoyée à | Exemple |
|---|---|---|
| `/api/...` | backend `:3001` | `POST /api/auth/login`, `POST /api/game` |
| `/ws/...` | backend `:3001`, en gardant la connexion WebSocket ouverte (`Upgrade`) | le socket.io du jeu (`/ws/socket.io`) |
| tout le reste (`/`) | frontend `:3000` | `/login`, `/lobby`, `/play`, les images… |

Donc `/api/` et `/ws/` vont **tous les deux au backend**. Seules les pages vont au frontend.
Le navigateur ne parle jamais directement au frontend ou au backend : il passe toujours par nginx sur le port 8443. Seul le backend parle à PostgreSQL.

**Principes clés :**

- **Un seul point d'entrée : nginx.** Le front et le back sont servis sur le même domaine, donc les cookies passent partout et il n'y a pas de CORS.
- **Le serveur fait autorité.** Toute la logique de jeu vit côté serveur. Le front n'applique aucune règle : il envoie une intention (« je joue cette carte sur ce pion »), et le serveur la valide ou la refuse.
- **L'état d'une partie en cours vit en mémoire** (une `Map` dans `GameService`). La base de données ne stocke que ce qui doit durer : utilisateurs, profils, parties et participants.
- **Le moteur de jeu est pur.** `backend/src/game/engine/` ne contient que des fonctions `(état, action) -> nouvel état`, sans Nest, sans Prisma et sans mutation. Il est donc facile à tester et à comprendre.

---

## 3. Arborescence

```
.
├── docker-compose.yml
├── nginx/
│   ├── Dockerfile            génère le certificat auto-signé
│   └── nginx.conf            routes / , /api/ , /ws/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     modèles de la BDD
│   │   └── migrations/
│   ├── generated/prisma/     client Prisma généré (ne pas éditer)
│   └── src/
│       ├── main.ts           préfixe global /api, cookie-parser
│       ├── app.module.ts
│       ├── prisma/           PrismaService (connexion BDD, global)
│       ├── auth/             inscription, login, refresh, logout, AuthGuard
│       ├── profile/          lecture / modification du profil
│       └── game/
│           ├── game.types.ts       TOUS les types du jeu (source de vérité)
│           ├── game.controller.ts  HTTP : créer / rejoindre / lancer
│           ├── game.gateway.ts     WebSocket : sync / action / broadcast
│           ├── game.service.ts     parties en mémoire, commit, bots
│           ├── broadcast.md        notes de conception du temps réel
│           └── engine/             règles du jeu (pur)
├── frontend/
│   ├── public/               images des cartes, etc.
│   └── src/
│       ├── pages/            une page = une route (Pages Router)
│       ├── api/              appels HTTP vers le backend
│       ├── game/             tout le plateau : socket, hooks, pions, cartes
│       ├── components/       UI réutilisable (auth, layout, rules, ui/ = shadcn)
│       ├── lib/              petits utilitaires
│       └── styles/
└── debrief_websocket.md      compte rendu de l'intégration WebSocket
```

---

## 4. Backend

Toutes les routes HTTP sont préfixées par **`/api`** (`app.setGlobalPrefix('api')`).

### 4.1 Authentification (`auth/`)

- L'utilisateur s'inscrit, puis se connecte avec son email et son mot de passe. Le mot de passe est hashé avec bcrypt.
- Au login, le serveur pose **deux cookies `httpOnly`, `secure`, `sameSite=strict`** :
  - `jwt` : l'access token, valable **15 min**, signé avec `JWT_SECRET` ;
  - `refresh_token` : valable **7 jours**, signé avec `JWT_REFRESH_SECRET`. Son hash est stocké en BDD (`User.hashedRefreshToken`), ce qui permet de le révoquer.
- `AuthGuard` lit le cookie `jwt` et place le payload `{ sub: userId, username }` dans `req.user`.
- Quand un appel renvoie 401, le front appelle `/api/auth/refresh` puis réessaie (voir `frontend/src/api/game.ts`).
- Le `JwtModule` est enregistré en `global: true`, donc `JwtService` est injectable partout, y compris dans la gateway WebSocket.

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, name, password }` : crée le user et un profil vide |
| POST | `/api/auth/login` | — | `{ email, password }` : pose les cookies |
| POST | `/api/auth/refresh` | cookie refresh | renouvelle les deux tokens (rotation) |
| POST | `/api/auth/logout` | ✔ | invalide le refresh token et supprime les cookies |

### 4.2 Profil (`profile/`)

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| GET | `/api/profile` | ✔ | profil du user connecté (+ `name`, `email`) |
| PATCH | `/api/profile` | ✔ | `{ bio?, avatar? }` |

### 4.3 Jeu (`game/`)

Le module est découpé en trois couches, chacune avec un rôle précis :

| Fichier | Rôle | Connaît… |
|---|---|---|
| `game.controller.ts` | routes HTTP (create / join / start) | le service |
| `game.gateway.ts` | WebSocket : auth du socket, messages `sync` / `action`, envoi de l'état | le service, `viewFor` |
| `game.service.ts` | possède la `Map` des parties, vérifie qui a le droit de jouer, persiste en BDD, fait jouer les bots | Prisma, l'engine |
| `engine/*` | les règles | rien d'autre que `game.types.ts` |

Routes HTTP (toutes protégées par `AuthGuard`) :

| Méthode | Route | Rôle | Réponse |
|---|---|---|---|
| POST | `/api/game` | crée une partie, le créateur est au siège 0 (hôte) | `{ gameId, inviteCode }` |
| POST | `/api/game/join/:inviteCode` | rejoint une partie en attente | `{ gameId, inviteCode }` |
| POST | `/api/game/start/:gameId` | l'hôte lance la partie, les places vides sont remplies par des IA | `{ gameId }` |

Ces routes ne renvoient **jamais** l'état de la partie. L'état arrive toujours par le WebSocket (voir §6).

#### `commit` : la règle d'or du service

```ts
private commit(game, event = null) {
    this.games.set(game.id, game);   // le serveur s'en souvient
    this.broadcast?.(game, event);   // les joueurs le voient
}
```

Chaque changement d'état visible (création, join, start, chaque coup humain, chaque coup de bot) passe par **un** `commit`. Il n'y a jamais d'état intermédiaire.

#### Les bots

Après chaque coup humain (et au `start`), `runBots` fait jouer les IA à la suite, avec **1 s de pause** et **un commit par coup** pour que les joueurs voient chaque coup. Pendant ce temps, un humain qui essaie de jouer est rejeté par le check « Not your turn », qui sert donc aussi de verrou.
L'IA actuelle (`engine/AI.ts`) choisit un coup légal au hasard.

---

## 5. Le moteur de jeu (`engine/`)

Tous les types sont dans `game/game.types.ts`. Chaque fonction de l'engine prend un état et renvoie un **nouvel** état, sans jamais le modifier.

### 5.1 Le plateau

```
BOARD_CELLS_COUNT = 72     cases 0 → 71, numérotation ABSOLUE (la même pour tous)
CELLS_PER_SEAT    = 18     écart entre deux sorties
HOME_CELLS_COUNT  = 4      maison : 0 = entrée (côté plateau), 3 = fond

siège 0 : sortie case  0   entrée de maison case 69
siège 1 : sortie case 18   entrée de maison case 15
siège 2 : sortie case 36   entrée de maison case 33
siège 3 : sortie case 54   entrée de maison case 51
```

- `startCell(seat) = seat * 18` : la case où arrive un pion qui sort.
- `getStartHome(seat) = startCell - 3` (mod 72) : la dernière case avant la maison. Un pas plus loin, on est en `home 0`.
- Un pion a trois positions possibles : `{ zone: 'spawn' }`, `{ zone: 'board', cell }` ou `{ zone: 'home', cell }`.
- Les calculs de case passent par `mod()` (`utils.ts`) pour boucler de 71 à 0, y compris en marche arrière.

### 5.2 Les cartes

- 52 cartes (4 couleurs × 1..13). Une `CardId` est une string `"heart_7"`.
- 4 joueurs, **5 cartes par manche**. Quand toutes les mains sont vides, on redistribue, et la défausse est remélangée si la pioche ne suffit plus.
- `realValueOf(card)` (`deck.ts`) donne le **nombre de cases** : c'est la valeur de la carte, sauf **le 4, qui vaut −4 (recul)**. Les règles et `applyAction` utilisent toutes les deux cette fonction, pour que validation et application ne divergent jamais.

| Carte | Effet |
|---|---|
| 1 (As), 13 (Roi) | sortir un pion du spawn (`exit`), ou avancer |
| 4 | reculer de 4 |
| 11 (Valet) | échanger deux pions du plateau (`swap`) |
| 7 | *prévu : répartir 7 pas entre plusieurs pions (`split`), pas encore codé* |
| autres | avancer du nombre de cases |

### 5.3 Les actions

```ts
type GameAction =
  | { type: 'move';    cardId, pawnId }            // avancer / reculer (plateau ou maison)
  | { type: 'enter';   cardId, pawnId }            // entrer dans la maison
  | { type: 'exit';    cardId, pawnId }            // sortir du spawn
  | { type: 'swap';    cardId, pawnIdA, pawnIdB }  // Valet
  | { type: 'split';   cardId, steps[] }           // 7 (TODO)
  | { type: 'discard'; cardId }                    // défausser une carte injouable
```

Les actions ne contiennent **que des ids**, jamais de cases : le serveur recalcule tout lui-même.

### 5.4 Les fichiers et le chemin d'un coup

| Fichier | Contenu |
|---|---|
| `board.ts` | géométrie : `startCell`, `getStartHome`, `homeCellIndex`, `pathCells`, `pawnAt`… |
| `deck.ts` | création et mélange du paquet, distribution, `playCard`, `realValueOf` |
| `rules.ts` | `canExit`, `canMove`, `canGoHome`, `canMoveInHome`, `canSwap`, `canDiscard` : **un coup est-il permis ?** |
| `legalMoves.ts` | `getLegalActions` (liste de tous les coups légaux) et `isLegal` (l'action reçue en fait-elle partie ?) |
| `apply.ts` | `applyAction` : **applique** un coup déjà validé, déplace les pions et gère les captures |
| `state.ts` | cycle de vie : `initGame`, `addPlayer`, `initStartingGame` (remplit avec des IA), `startRound`, `playTurn`, `checkWinner`, `nextSeat` |
| `view.ts` | `viewFor(game, seat)` : ce qu'un joueur a le droit de voir |
| `AI.ts` | `chooseAIAction` |

```
playTurn(game, seat, action)
  1. isLegal(...)        refusé → null → "Illegal move"
  2. applyAction(...)    nouveaux pions + pions capturés
  3. playCard(...)       la carte passe de la main à la défausse
  4. checkWinner(...)    tous les pions d'un joueur en maison → phase 'finished'
  5. nextSeat(...)
  6. isRoundOver ?       → startRound (nouvelle distribution), event.newRound = true
  → { game, event }
```

**Captures :** un pion qui termine son déplacement (ou sa sortie) sur une case occupée renvoie l'occupant au spawn, même si c'est un de ses propres pions.
**Blocage :** un pion posé sur **sa propre** case de sortie bloque le passage à tous les autres.

---

## 6. Temps réel : WebSockets

Socket.io est servi sur **`/ws/socket.io`**, un chemin que nginx proxifie avec l'upgrade WebSocket.

### Connexion

1. Le navigateur envoie automatiquement le cookie `jwt` dans le handshake.
2. `handleConnection` vérifie le token. S'il est invalide, le socket est déconnecté. Le front appelle alors `/api/auth/refresh` et se reconnecte.
3. Le socket rejoint la room **`user-<userId>`**. Tous les onglets d'un même joueur reçoivent donc l'état.

### Protocole

| Sens | Message | Contenu | Quand |
|---|---|---|---|
| serveur → client | `state` | `{ state: GameView, event: GameEvent \| null }` | à chaque `commit`, et en réponse à `sync` |
| serveur → client | `no-game` | — | réponse à `sync` si le joueur n'a pas de partie |
| client → serveur | `sync` | — | arrivée sur une page de jeu, reconnexion |
| client → serveur | `action` | `{ gameId, action }` + ack `{ ok } \| { error }` | le joueur joue |

### `state` et `event`

- **`state` (GameView) est la vérité.** Le front affiche exactement ça. `viewFor` **cache la pioche et la main des autres** : on ne reçoit que sa propre main (`myHand`) et le nombre de cartes des autres (`handCount`).
- **`event` (GameEvent) est un indice pour animer** : qui a joué, quelle action, quels pions ont été capturés, s'il y a eu une nouvelle distribution. Il vaut `null` quand il n'y a rien à animer.
- Le serveur reste en coordonnées **absolues**. C'est le front qui fait tourner le plateau pour que chaque joueur se voie en bas.

### Trajet complet d'un coup

```
clic carte + clic pion (front, useTurnChoice)
  → socket.emit('action', { gameId, action }, ack)
  → GameGateway.handleAction
  → GameService.playAction     (partie existe ? joueur dedans ? son tour ?)
  → playTurn (engine)          → { game, event }
  → commit                     → Map + broadcast
  → pour chaque humain : emit('state', { state: viewFor(game, seat), event })
  → useGame (front) → setState → React redessine, motion anime
  → runBots : un coup par seconde, un commit par coup
```

Pour plus de détails : `backend/src/game/broadcast.md` (conception) et `debrief_websocket.md` (implémentation).

---

## 7. Frontend

Next.js en **Pages Router** : chaque fichier de `src/pages/` est une route. `/` redirige vers `/login` (`next.config.ts`).

### Pages

| Route | Rôle |
|---|---|
| `/login`, `/register` | authentification |
| `/menu` | menu principal |
| `/profile` | profil |
| `/rules` | règles du jeu |
| `/create-game` | `POST /api/game` puis `/lobby` |
| `/join-game` | saisie du code d'invitation, puis `/lobby` |
| `/lobby` | salle d'attente en temps réel ; bouton Start pour l'hôte ; tout le monde part sur `/play` quand la partie démarre |
| `/play` | plateau + main |

### Dossier `src/game/`

| Fichier | Rôle |
|---|---|
| `gameTypes.ts` | copie des types du backend. **À garder synchronisée avec `game.types.ts`** |
| `socket.ts` | un seul socket pour toute l'app, créé au premier usage (jamais pendant le rendu serveur) |
| `useGame.ts` | écoute `state` / `no-game`, émet `sync`, expose `sendAction` |
| `useTurnChoice.ts` | construit l'action du joueur : carte, puis mode, puis pion. Aucune règle n'est vérifiée ici |
| `boardGeometry.ts`, `boardPawns.ts`, `PawnLayer.tsx`, `Pawn.tsx`, `MovePreview.tsx` | placement et animation des pions |
| `CardTable.tsx`, `cardDeck.ts`, `cardLayout.ts` | main, défausse, animation des cartes |
| `TurnControls.tsx`, `PlayerAvatars.tsx` | « À toi / Tour de X », boutons de mode, joueurs |

### Conventions

Voir `frontend/CLAUDE.MD`. En résumé : code simple et lisible, **pas de nouvelle dépendance** en dehors de la stack (Next, React, Tailwind, shadcn, motion), et des noms explicites (`isX`, `handleX`, `onX`).

---

## 8. Identité visuelle et design system

Le site a une identité à lui : un **papier beige**, une **encre bleu nuit** et des **traits usés, dessinés à la main**, comme un vieux jeu de cartes griffonné. Tout part de quelques tokens définis une seule fois, puis réutilisés par tous les composants.

Les images de cette section sont dans `docs/design-system/`.

### 8.1 Couleurs

![Palette](docs/design-system/palette.png)

Toutes les couleurs sont des variables CSS dans `frontend/src/styles/globals.css` (`:root`). Tailwind les expose en classes (`bg-primary`, `text-muted-foreground`…) : aucun composant n'écrit de couleur en dur.

| Rôle | Tokens | Utilisation |
|---|---|---|
| Papier | `--background`, `--card`, `--muted`, `--border` | fond des pages, cartes posées dessus, bordures |
| Encre | `--foreground`, `--muted-foreground` | texte, traits, dessins |
| Bleus | `--primary`, `--accent`, `--secondary` | boutons, liens, focus |
| Équipes | `--team-0` à `--team-3` | les 4 joueurs du plateau (pions, avatars, badges) |

### 8.2 Typographie

![Typographie](docs/design-system/typography.png)

- **Fraunces** (`font-heading`) : titres, noms, gros boutons. Un serif avec du caractère, qui rappelle les cartes à jouer.
- **Public Sans** (`font-body`) : texte courant, formulaires. Sobre et lisible.
- Les deux sont chargées par `next/font` dans `_app.tsx`.
- Les tailles suivent une **échelle modulaire de ratio 1.333** (`@theme` dans `globals.css`), de `text-sm` (0.75 rem) à `text-5xl` (4.21 rem).

### 8.3 Le trait usé

C'est la signature visuelle du site. Toutes les lignes (cadres, séparateurs, soulignés, header, footer) passent par deux utilitaires CSS maison :

- **`worn-line`** : un bruit SVG (`feTurbulence`) sert de masque et efface le trait par endroits, comme de l'encre usée.
- **`worn-underline`** : la même chose pour souligner un lien, sans abîmer le texte.

Les formes rondes (cases du plateau, pions, badges) utilisent `lib/game/handDrawn.ts`, qui trace des cercles et des lignes légèrement tremblés. Le tremblement dépend d'une graine fixe : le dessin ne change jamais d'un rendu à l'autre.

### 8.4 Illustrations

Les démons, les cartes et le logo (`frontend/public/`) gardent le même style d'encre que le reste du site.

<p>
  <img src="frontend/public/demons/heart_demon.png" height="90" alt="Démon cœur">
  <img src="frontend/public/demons/spade_demon.png" height="90" alt="Démon pique">
  <img src="frontend/public/demons/diamond_demon.png" height="90" alt="Démon carreau">
  <img src="frontend/public/demons/club_demon.png" height="90" alt="Démon trèfle">
  &nbsp;&nbsp;
  <img src="frontend/public/cards/card_heart_1.png" height="90" alt="As de cœur">
  <img src="frontend/public/cards/card_spade_13.png" height="90" alt="Roi de pique">
  <img src="frontend/public/cards/card_diamond_11.png" height="90" alt="Valet de carreau">
</p>

Les petites icônes d'interface viennent de `lucide-react` et suivent la couleur du texte (`currentColor`).

### 8.5 Composants réutilisables

Ces composants sont écrits par nous. Ils reçoivent leur contenu par leurs props et ne dépendent d'aucune page : on peut les poser n'importe où.

#### Mise en page

| Composant | Rôle |
|---|---|
| `PageLayout` | structure commune à toutes les pages : header, contenu centré, footer |
| `Header` / `Footer` | bandeaux du site, séparés du contenu par un trait usé |
| `Title` / `Subtitle` | titres de page, sur l'échelle typographique |
| `WornFrame` | la « carte » du site : un double cadre au trait usé, les deux traits s'usant à des endroits différents |

![Header](docs/design-system/header.png)

<img src="docs/design-system/worn-frame.png" width="320" alt="WornFrame">

`WornFrame` sert pour le login, l'inscription, chaque section des règles, le profil, la page pour rejoindre une partie, la privacy policy et les terms.

Les boutons et le séparateur partent de shadcn/ui mais sont repris avec nos tokens et notre typographie ; le séparateur et la variante `link` des boutons ont le trait usé :

![Boutons et séparateur](docs/design-system/buttons.png)

#### Cartes

| Composant | Props | Rôle |
|---|---|---|
| `TiltCard` | `imagePath`, `label` | une carte qui s'incline vers le pointeur et grossit au survol (ressort `motion`) |
| `CardRule` | `name`, `imagePath`, `children` | une `TiltCard` avec son nom et son explication |

<img src="docs/design-system/tilt-card.gif" width="450" alt="TiltCard au survol">

![CardRule dans un WornFrame](docs/design-system/card-rules.png)

#### Démons et animations

| Composant | Props | Rôle |
|---|---|---|
| `DemonCircle` | `children`, `variant` | une ronde de démons qui tourne autour (ou au-dessus) de n'importe quel contenu |
| `DemonDrawing` | `image` | n'importe quel dessin de démon, passé à l'encre de la palette |
| `SparkleTrail` | `getSpots` | traînée d'étincelles derrière ce qui bouge (les démons de la ronde) |
| `DemonCampfire` | — | les quatre démons qui dansent autour du feu (menu) |
| `CracklingFire` | — | le feu animé, fait entièrement en code |
| `AngerMarks` | `isVisible` | petites marques de colère au-dessus d'un personnage |

<p>
  <img src="docs/design-system/demon-circle.gif" width="380" alt="DemonCircle">
  <img src="docs/design-system/campfire.gif" width="440" alt="DemonCampfire et CracklingFire">
</p>

#### Jeu

| Composant | Props | Rôle |
|---|---|---|
| `SeatBadge` | `seat`, `isTaken` | le démon d'un siège dans un cercle tremblé aux couleurs de l'équipe ; grisé et en pointillés si la place est libre |
| `Pawn` | `color`, `position`, `path`, `isSelectable`, `onClick`… | pion dessiné à la main, qui marche case par case le long de `path` |
| `TurnBanner` | `isMyTurn`, `mySeat` | « À toi de jouer ! » écrit un instant en travers du plateau |
| `WinScreen` | `winnerSeat`, `winnerName`, `isMe` | écran de victoire avec confettis |
| `PasswordInput` | props d'un `input` | champ mot de passe avec bouton afficher / masquer |

---

## 9. Base de données (Prisma)

Schéma : `backend/prisma/schema.prisma`. Le client est généré dans `backend/generated/prisma`.

```
User 1───1 Profile           (bio, avatarUrl)
User 1───* GamePlayer *───1 Game
                               (inviteCode, phase, winnerSeat, finishedAt)
```

| Modèle | Rôle |
|---|---|
| `User` | compte : `name`, `email`, `password` (hashé), `hashedRefreshToken` |
| `Profile` | infos publiques, créées vides à l'inscription |
| `Game` | une partie : code d'invitation, `phase` (`waiting` / `playing` / `finished`), gagnant |
| `GamePlayer` | un humain assis à un siège d'une partie. Les IA ne sont pas stockées |

> La BDD ne garde **pas** l'état de jeu (pions, cartes) : il vit en mémoire dans `GameService`. Si le backend redémarre, les parties en cours sont perdues.

### Modifier le schéma

Après une modification de `schema.prisma`, créer une migration :

```bash
docker compose exec backend npx prisma migrate dev --name <nom-de-la-migration>
# ex : docker compose exec backend npx prisma migrate dev --name add-user-avatar
```

Régénérer le client si besoin :

```bash
docker compose exec backend npx prisma generate
```

Explorer la base :

```bash
docker compose exec backend npx prisma studio
```

---

## 10. État du projet / reste à faire

**Fonctionne :** inscription / login / refresh, profil, création / join / start de partie, salle d'attente en temps réel, remplissage par des IA, coups `move` / `enter` / `exit` / `swap` / `discard`, captures, redistribution, détection du gagnant, animations.

**À faire :**

- [ ] **Le 7 (`split`)** : `canSplit`, `case 'split'` dans `applyAction` et dans `sameAction`.
- [ ] **Fin de partie** : écrire `phase` / `winnerSeat` / `finishedAt` en BDD, retirer la partie de la `Map`, et faire ignorer les parties finies par `findGameOfUser`.
- [ ] **Déconnexion / leave / abandon** : `handleDisconnect` dans la gateway, mise à jour d'`isConnected`, délai de grâce (un refresh n'est pas un abandon), route ou message `leave`, et un état « abandonnée » distinct de « terminée ».
- [ ] **Salle d'attente** : pouvoir la quitter, et gérer le départ de l'hôte.
- [ ] **Règles à trancher** : Valet sur un pion protégé ou sur ses propres pions, défausse autorisée si une autre carte est jouable, parties en équipes 2v2.
- [ ] **Tests unitaires de l'engine** (Jest) : `homeCellIndex`, `enter`, passage de 71 à 0, recul du 4, captures.
- [ ] Privacy policy et terms of use.

---

## 11. Gestion des erreurs et logs

Les logs du backend et de nginx sont centralisés dans la stack ELK : **Kibana** sur http://localhost:5601, index `app-logs-*`. Le guide complet (niveaux, champs, filtres, tests) est dans [`docs/logs-guide.md`](docs/logs-guide.md).

### Le trajet d'un log

```
NestJS (nestjs-pino) ──tcp:5000──► Logstash ──► Elasticsearch ──► Kibana
nginx                ──syslog:5140─►
```

Chaque log est un objet JSON. Le champ `service` (`backend` / `nginx`) est ajouté par Logstash, `context` est le nom passé à `new Logger('...')`, et `level` vaut 20 (debug), 30 (info), 40 (warn) ou 50 (error).

### Trois couches de gestion d'erreur

| Couche | Fichier | Ce qu'elle attrape |
|---|---|---|
| **pino-http** | `config/logger.config.ts` | Chaque requête HTTP : méthode, url, code, durée. 5xx → error, 4xx → warn, sinon info. |
| **`AllExceptionFilter`** | `config/all-exceptions.filter.ts` | Toute exception levée pendant une requête HTTP. `HttpException` (< 500) → warn `request refused`, le reste → error `unhandled error`. Elle rend ensuite la main à Nest, qui renvoie la réponse au client. |
| **Logs manuels** | `game.gateway.ts`, `friends.gateway.ts`, `game.service.ts` | Tout ce qui n'est **pas** une requête HTTP : événements WebSocket, bots joués en arrière-plan, timers de déconnexion. |

**La règle est la même partout :** une erreur **attendue** (mauvais code d'invitation, coup illégal, JWT expiré) est une `HttpException`, loggée en **warn**. Une erreur **inattendue** (exception JS, base de données en panne, bot bloqué) est un bug, loggée en **error**.

### Conventions

- Les erreurs « métier » se lancent avec les exceptions Nest (`NotFoundException`, `ConflictException`, …), jamais avec `new Error`. C'est ce qui donne le bon code HTTP et le bon niveau de log.
- Côté WebSocket, l'erreur est renvoyée dans l'ack du client (`{ error: message }`) **et** loggée par `logWsError`.
- Une promesse lancée sans `await` doit avoir son `.catch(err => this.logger.error(...))`, sinon son erreur est perdue.
- Pas de `console.log` / `console.error` : ils n'arrivent pas dans Kibana.
- Ne jamais logger de mot de passe, token ou cookie : `redact` les masque déjà dans les requêtes HTTP (`logger.config.ts`).

### Retrouver une erreur

```
service : "backend" and level >= 50     # les bugs
context : "GameService" and gameId : 3   # l'histoire de la partie 3
req.id : 21                              # les lignes d'une même requête HTTP
```
