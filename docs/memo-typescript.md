# Mémo TypeScript pour lire Transcendance

Tous les exemples viennent du code (`backend/src/game/`).

## 1. Par où commencer

**La stack**
- **Backend** : NestJS + Prisma (Postgres) + socket.io, dans `backend/src/`.
- **Frontend** : Next.js 16 / React 19 + Tailwind + socket.io-client, dans `frontend/`.

**Ordre de lecture conseillé pour le jeu** : on part des types et on remonte vers le réseau.

1. `game/game.types.ts` : le modèle de données. **À lire en premier**, tout le reste en découle.
2. `game/engine/utils.ts` et `board.ts` : la géométrie du plateau (cases, départ, maison).
3. `engine/deck.ts` : les cartes.
4. `engine/rules.ts` : une fonction `canXxx()` par type de coup.
5. `engine/legalMoves.ts` : génère la liste des coups légaux et vérifie un coup (`isLegal`).
6. `engine/apply.ts` : applique un coup aux pions.
7. `engine/state.ts` : orchestre un tour complet (`playTurn`).
8. `engine/view.ts` : ce que chaque joueur a le droit de voir.
9. `game.service.ts`, puis `game.controller.ts` (HTTP) et `game.gateway.ts` (websocket).

**Règle d'or du moteur** : les fonctions sont **pures**. Elles ne modifient rien, elles renvoient un nouvel objet (`{...game, ...}`). Seul `GameService.commit()` stocke l'état et le diffuse.

## 2. Syntaxe de base

| Tu vois | Ça veut dire |
|---|---|
| `x: number` | annotation : `x` est un nombre |
| `function f(a: Pawn[]): Pawn \| null` | `f` prend un tableau de `Pawn` et renvoie un `Pawn` ou `null` |
| `type Seat = 0 \| 1 \| 2 \| 3` | **union de littéraux** : seules ces 4 valeurs sont acceptées |
| `type Card = { id: CardId; ... }` | forme d'un objet (équivalent d'une `interface`) |
| `hand?: Card[]` | propriété optionnelle (peut valoir `undefined`) |
| `private broadcast?: (g: Game) => void` | propriété dont le type est une fonction |
| `Map<number, Game>` | **générique** : une Map avec des clés `number` et des valeurs `Game` |
| `export` / `import { X } from './y'` | modules ES : on importe ce qu'un autre fichier exporte |
| `import * as Rules from './rules'` | importe tout le fichier sous un nom, puis `Rules.canMove(...)` |

À savoir : les types **disparaissent à la compilation**. Ils servent au compilateur et à l'IDE, pas à l'exécution.

## 3. Les patterns clés du repo

### Union discriminée (le plus important)

```ts
type PawnPosition =
  | { zone: 'spawn' }
  | { zone: 'board'; cell: number }
  | { zone: 'home'; cell: number };
```

Le champ `zone` (ou `type` dans `GameAction`) est le **discriminant**. Après un test sur ce champ, TS sait quelle variante tu as entre les mains. C'est ce qu'on appelle le **narrowing** :

```ts
if (pawn.position.zone === 'spawn') return ...;
pawn.position.cell   // OK : TS sait que ce n'est plus 'spawn'
```

Le `switch (action.type)` de `apply.ts` fonctionne pareil : dans `case 'swap'`, `action.pawnIdA` existe.

### `as const` et `typeof ...[number]`

```ts
const CARD_VALUES = [1, 2, ..., 13] as const;          // tuple en lecture seule
type CardValue = (typeof CARD_VALUES)[number];         // => 1 | 2 | ... | 13
```

On obtient à la fois une valeur utilisable à l'exécution et un type, sans rien dupliquer.

### Template literal type

```ts
type CardId = `${CardColor}_${CardValue}`;   // 'heart_1' | ... | 'diamond_13'
```

### Types utilitaires (dans `game.types.ts`)

- `Omit<Player, 'hand'>` : `Player` sans le champ `hand`.
- `A & { handCount: number }` : **intersection**, on ajoute des champs à `A`.

`GameView` et `PlayerView` sont construits comme ça : ils cachent la pioche et les mains des autres joueurs.

### Assertion `as`

`x as Seat` ou `error as Error`. Ça veut dire « fais-moi confiance, TS ». **Aucune vérification n'a lieu à l'exécution.** C'est donc un endroit où un bug peut se cacher (par exemple `game.players.length as Seat` quand il y a plus de 4 joueurs).

### Non-null `!`

`players.find(...)!` affirme que le résultat n'est pas `undefined`. Même risque que `as`.

## 4. JS moderne très présent

| Syntaxe | Exemple du repo | Effet |
|---|---|---|
| Spread d'objet | `{...game, currentSeat: 1}` | copie avec un champ remplacé (immutabilité) |
| Spread de tableau | `[...game.players, newPlayer]` | nouveau tableau avec un élément en plus |
| Destructuring + rest | `const { drawPile, players, ...rest } = game` | extrait deux champs, `rest` contient le reste |
| Destructuring en paramètre | `players.map(({ hand, ...player }) => ...)` | idem, directement dans la callback |
| Swap | `[a[i], a[j]] = [a[j], a[i]]` | échange deux cases (Fisher-Yates dans `deck.ts`) |
| `??` | `found ?? null` | valeur par défaut si `null` ou `undefined` (et seulement ceux-là) |
| `?.` | `pawnAt(...)?.playerSeat`, `this.broadcast?.(...)` | s'arrête et renvoie `undefined` si c'est nul |
| Arrow function | `p => p.id === id` | fonction courte |
| `.map` / `.filter` / `.find` / `.some` / `.every` | partout | transformer / filtrer / 1er trouvé / « au moins un » / « tous » |
| `async` / `await` | `await this.prisma.game.create(...)` | attend une Promise |
| `void promise` | `void this.runBots(id)` | lance la Promise sans l'attendre (volontaire) |

## 5. NestJS : le « magique » à décoder

- **`@Something()`** est un **décorateur**, c'est-à-dire des métadonnées lues par Nest.
  - `@Controller('game')` + `@Post('join/:inviteCode')` crée la route `POST /api/game/join/:inviteCode` (le préfixe `api` est défini dans `main.ts`).
  - `@Param('gameId', ParseIntPipe)` lit le paramètre d'URL et le convertit en nombre.
  - `@UseGuards(AuthGuard)` vérifie le JWT avant d'appeler la méthode.
- **Injection de dépendances** : `constructor(private gameService: GameService) {}`. Nest crée le service et le passe au constructeur. Le `private` dans le constructeur déclare **et** assigne `this.gameService` en une seule fois.
- **`@Injectable()`** : la classe peut être injectée ailleurs.
- **`@Module({ imports, controllers, providers })`** : c'est ce qui relie les pièces entre elles (voir `app.module.ts`).
- **Gateway websocket** (`game.gateway.ts`) :
  - `@SubscribeMessage('action')` appelle la méthode quand le client fait `emit('action')`. La valeur renvoyée part dans l'**ack** du client.
  - `handleConnection` lit le cookie `jwt` et place la socket dans la room `user-<id>`.
  - `afterInit` donne au service la fonction de broadcast. Le service ne connaît donc pas socket.io : c'est de l'**inversion de dépendance**.

### Le flux d'un coup, de bout en bout

```
front emit('action')
  -> gateway.handleAction
  -> service.playAction           (vérifie le tour)
  -> playTurn                     (isLegal -> applyAction -> playCard -> checkWinner -> nextSeat)
  -> commit                       (stocke dans la Map)
  -> broadcast 'state'            (un viewFor par siège)
  -> runBots en tâche de fond
```

## 6. Pièges et astuces

- **`null` et `undefined`** : `.find()` renvoie `undefined`, alors que le code du jeu utilise `null`. D'où les `?? null`. La config active `strictNullChecks`, donc TS oblige à gérer ces cas. C'est l'origine des « cannot be true mais TS oblige ».
- **`0` est falsy** : `if (winner)` est faux pour le siège 0. Il faut écrire `!== null`, comme le fait déjà `state.ts`.
- **`===` partout** : on n'utilise jamais `==`.
- **`noImplicitAny: false`** : un paramètre sans annotation devient `any` sans avertissement. Se méfier de `(req as any).user`.
- **Mutation cachée** : `initStartingGame` fait `game.players.push(...)`, donc il modifie l'objet reçu. C'est une exception au style pur du moteur.

### Dans l'IDE (VS Code)

- Survoler une variable affiche son type exact après narrowing. C'est l'outil n°1 pour comprendre.
- `F12` : aller à la définition. `Shift+F12` : voir toutes les références.
- `Ctrl+Clic` sur un type (`GameAction`) : ouvre sa définition.
- Pour tester sa compréhension, écrire `const x: Seat = 5;` et regarder l'erreur rouge.
