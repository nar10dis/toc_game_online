# Debrief — WebSockets (socket.io)

J'ai suivi le plan de `backend/src/game/broadcast.md` presque à la lettre :
`commit` = set + broadcast, une gateway qui donne la fonction de broadcast au service,
un `GameEvent` pour animer, une `viewFor` par joueur.

## Le trajet d'un coup

```
clic carte + clic pion (front)
  -> socket.emit('action', { gameId, action }, ack)
  -> GameGateway.handleAction
  -> GameService.playAction   (checks : partie, joueur, son tour)
  -> playTurn (engine)        -> { game, event }
  -> commit(game, event)      -> games.set + broadcast
  -> pour chaque humain : emit('state', { state: viewFor(game, seat), event })
  -> useGame (front) : setGame(state) -> React redessine, motion anime
  -> runBots : 1 coup de bot / seconde, 1 commit par coup
```

L'ack ne renvoie que `{ ok: true }` ou `{ error: "Illegal move" }`.
Le nouvel état arrive **toujours** par `'state'`, pour tout le monde, y compris pour celui qui a joué.

## Protocole

| Sens | Message | Contenu | Quand |
|---|---|---|---|
| serveur -> client | `state` | `{ state: GameView, event: GameEvent \| null }` | à chaque `commit` (create, join, start, chaque coup humain ou bot), et en réponse à `sync` |
| serveur -> client | `no-game` | — | réponse à `sync` si le joueur n'est dans aucune partie |
| client -> serveur | `sync` | — | à l'arrivée sur une page de jeu et à chaque (re)connexion |
| client -> serveur | `action` | `{ gameId, action: GameAction }` + ack | quand le joueur joue |

Create / join / start restent en HTTP (déjà codés). Ils déclenchent un `commit`, donc un broadcast.

## Backend

- **`game.gateway.ts`** (nouveau)
  - `@WebSocketGateway({ path: '/ws/socket.io' })` : nginx a déjà une `location /ws/` avec l'upgrade websocket, donc aucun changement nginx.
  - `handleConnection` : lit le cookie `jwt` dans le handshake, le vérifie avec `JwtService` (comme l'`AuthGuard`), puis met le socket dans la room `user-<userId>`. Si le token est invalide : `disconnect()`.
  - `afterInit` : `setBroadcaster(...)` envoie `viewFor(game, seat)` à la room de chaque humain et saute les bots.
  - `sync` : renvoie l'état de la dernière partie du joueur. Ça sert quand on change de page ou qu'on se reconnecte.
  - `action` : appelle `playAction`, attrape l'exception et la renvoie dans l'ack.
- **`game.service.ts`**
  - `commit(game, event = null)`.
  - `playAction` : checks puis `playTurn` puis `commit`, et enfin `void runBots()`. Le check « Not your turn » sert de verrou pendant que les bots jouent.
  - `runBots` : boucle avec pause de 1 s (`BOT_DELAY_MS`), un commit par coup. `startGame` l'appelle aussi.
  - `findGameOfUser(userId)` : utilisé par `sync`.
  - `joinGame` / `startGame` renvoient maintenant `{ gameId, inviteCode }` / `{ gameId }` au lieu de la `Game` entière. Avant, `startGame` renvoyait en HTTP la main de tout le monde et la pioche.
- **`engine/state.ts`** : `playTurn` renvoie `{ game, event }` au lieu de `{ game, result }`, avec `event = { seat, action, captured, newRound }` (voir broadcast.md §5).
- **`engine/view.ts`** : `viewFor` (voir broadcast.md §6).
- **`game.types.ts`** : ajout de `GameEvent`, `PlayerView`, `GameView`, `StateMessage`.
- **`game.controller.ts`** : `ParseIntPipe` sur `gameId`. Sans lui, `gameId` arrivait en string et `games.get("7")` ne trouvait jamais la partie, donc start renvoyait toujours 404.
- Dépendances : `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.

### 2 bugs corrigés dans l'engine
- `if (winner)` dans `playTurn` : le siège 0 est falsy, donc le joueur 0 ne pouvait jamais gagner. C'est maintenant `winner !== null`.
- Le `ParseIntPipe` ci-dessus.

## Frontend

Le front s'adapte aux types du back, pas l'inverse.

| Fichier | Rôle |
|---|---|
| `game/gameTypes.ts` | copie des types du back (`Card`, `Pawn`, `GameView`, `GameEvent`, `GameAction`...) |
| `game/socket.ts` | un seul socket pour toute l'app, créé au premier usage (pas pendant le rendu serveur de Next). Si le serveur nous kick (jwt expiré) : `/api/auth/refresh` puis reconnexion |
| `game/useGame.ts` | écoute `state` / `no-game`, émet `sync` à la connexion, expose `sendAction` |
| `game/useTurnChoice.ts` | le joueur construit son action : carte, puis mode (avancer / rentrer / échanger / défausser), puis pion. **Aucune règle vérifiée côté front** : le serveur décide, on affiche son refus |
| `game/boardPawns.ts` | pions serveur vers pions affichés (+ zone `home`). Utilise `event` pour faire marcher le pion case par case sur un `move` / `exit` |
| `game/TurnControls.tsx` | « À toi / Tour de X / X a gagné », boutons de mode, message d'erreur |
| `game/CardTable.tsx` | piloté par `myHand` + `discardPile`. Clé = `card.id` : une carte jouée reste le même élément et vole de la main vers la pile. Les cartes des autres arrivent depuis le coin |
| `game/cardDeck.ts` | réécrit pour la `Card` du serveur (`color`, `value`) |
| `pages/create-game.tsx` | bouton qui fait `POST /api/game` puis `/lobby` |
| `pages/join-game.tsx` | code d'invitation, puis `POST /api/game/join/:code`, puis `/lobby` |
| `pages/lobby.tsx` | salle d'attente en temps réel (les joins arrivent par le socket), bouton Start pour l'hôte (siège 0), tout le monde part sur `/play` quand `phase` change |
| `pages/play.tsx` | plateau + main branchés sur `useGame` |

Supprimés : `usePawns.ts` et `usePlayerHand.ts`, la simulation locale que le serveur remplace.
Corrigé : `PlayerAvatars` indexait les noms par position dans la liste filtrée et non par siège.

Dépendance : `socket.io-client`. Le `CLAUDE.MD` du front interdit les nouvelles libs, mais tu as demandé socket.io explicitement.

## Tester

```bash
docker compose up --build -V   # -V : sinon le volume anonyme /app/node_modules garde les anciens modules
```
Ensuite, sur https://localhost:8443 : login, Create game, copier le code, (2e navigateur : Join), Start.

J'ai vérifié le backend de bout en bout avec un vrai client socket.io (Prisma mocké) : socket sans jwt kické, `sync` puis `no-game`, broadcast au create / start / chaque coup, events des 3 bots, ack `Illegal move` sur un coup faux, et `drawPile` jamais envoyée.
Le front compile (`tsc`, `eslint`), mais je ne l'ai pas testé dans un navigateur (il faut la stack docker complète).

## Ce qui n'est PAS fait / à savoir

- **`applyAction` ne gère que `move` et `exit`.** `enter` et `swap` sont acceptés comme légaux, mais les pions ne bougent pas (la carte est quand même consommée).
- Pas de leave, pas de gestion de déconnexion (`isConnected` jamais mis à jour), pas d'abandon.
- Pas de rotation du plateau pour se mettre en bas (broadcast.md §6, côté client). Le siège 3 est toujours en bas et son avatar est caché derrière la main.
- Les animations sont celles de motion quand l'état change : pas de séquence « carte, puis pion, puis captures ». Les captures glissent simplement vers le spawn.
- `split` n'est pas géré (comme dans l'engine).
- `backend/src/auth/decorators/current-user.decorator.ts` était inachevé et bloquait la compilation Nest : il est complété (`@currentUser()` renvoie `req.user`).
- Erreur de type qui existait avant et que je n'ai pas touchée : `frontend/src/pages/profile.tsx:38` (sans effet sur `next dev`).
