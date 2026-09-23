# Broadcast — notes pour plus tard

## 1. `commit` = set + broadcast

A chaque nouvel etat que les joueurs doivent voir (coup humain, coup de bot, join, start) :

```ts
private commit(game: Game, event: GameEvent | null = null) {
    this.games.set(game.id, game);   // le serveur s'en souvient
    this.broadcast?.(game, event);   // les joueurs le voient
}
```

- `set` seul : le serveur connait le coup, les ecrans ne bougent pas.
- `broadcast` seul : les joueurs voient le coup, mais le serveur l'a oublie.
- `game.id` est dans l'objet (mis par `initGame`, recopie par chaque `{...game}`), pas besoin de le passer.
- `commit` vit dans `GameService` (il possede la Map et le callback), pas dans l'engine (pur) ni dans la gateway.

### Quand commit ?

Un commit = **un etat stable qu'on veut montrer**, pas une fonction de l'engine.

| Moment | Commit |
|---|---|
| Creation, join | 1 par evenement (event `null`) |
| Demarrage (`fillWithAI` + `startGame` + `startRound`) | 1 seul, a la fin |
| Coup d'un humain (`playTurn`) | 1, avec son `GameEvent` |
| Chaque coup de bot | 1 par bot, avec son `GameEvent` |

Jamais d'etat intermediaire (ex: entre `applyAction` et `nextSeat`) : incoherent pour les joueurs ET garde dans la Map.

## 2. Le callback `broadcast`

```ts
private broadcast?: (game: Game, event: GameEvent | null) => void;   // undefined tant qu'il n'y a pas de gateway
setBroadcaster(fn: (game: Game, event: GameEvent | null) => void) { this.broadcast = fn; }
```

- Le type se lit : "une fonction qui prend un Game (+ un event) et ne renvoie rien". Le `void` est le retour de la fonction.
- `?.` : si `broadcast` est `undefined`, l'appel ne fait rien (pas de crash avant les WebSockets).
- Le service ne sait pas COMMENT on envoie : c'est la gateway qui lui donne la fonction.

## 3. La gateway (socket.io)

```ts
@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;
    constructor(private gameService: GameService) {}

    afterInit() {
        this.gameService.setBroadcaster((game, event) => {
            for (const p of game.players) {
                if (isAI(p)) continue;   // les bots n'ont pas de navigateur
                this.server.to(`user-${p.userId}`).emit('state', { state: viewFor(game, p.seat), event });
            }
        });
    }

    @SubscribeMessage('action')
    handleAction(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: number; action: GameAction }) {
        this.gameService.playAction(body.gameId, client.data.userId, body.action);
        // pas de return : commit -> broadcast enverra le nouvel etat
    }
}
```

- A la connexion : `client.data.userId` depuis le JWT, et `client.join(\`user-${userId}\`)`.
- Trajet : clic -> `emit('action')` -> gateway -> `playAction` -> engine -> `commit` -> `broadcast` -> `emit('state')` -> le front anime puis redessine.

## 4. Les bots : un commit par coup

Sinon le joueur ne voit rien entre son coup et son tour suivant.

```ts
async playAction(...) {
    // checks
    const out = playTurn(game, seat, action);
    if (!out) throw new BadRequestException('Illegal move');
    this.commit(out.game, out.event);   // coup de l'humain
    void this.runBots(gameId);          // pas de await : on repond tout de suite
}

private async runBots(gameId: number) {
    let game = this.games.get(gameId)!;
    while (game.phase === 'playing' && isAI(game.players[game.currentSeat])) {
        await new Promise(r => setTimeout(r, 800));
        const seat = game.currentSeat;
        const action = chooseAIAction(game, seat);
        const out = action && playTurn(game, seat, action);
        if (!out) break;
        game = out.game;
        this.commit(game, out.event);   // chaque coup de bot
    }
}
```

- `set` a chaque coup : pendant les pauses la Map doit contenir l'etat reel.
- Un humain qui joue pendant les bots est rejete par le check "Not your turn" -> ce check sert de verrou.
- Appeler aussi `runBots` a la fin du `startGame` du service (si le seat 0 est un bot).
- `playAITurns` (sans pause) dans `engine/AI.ts` : utile pour les tests de l'engine seulement.

## 5. `GameEvent` : ce qui vient de se passer (pour animer)

Un `playTurn` contient plusieurs animations (carte jouee, deplacement, captures, redistribution).
Le front ne doit PAS les deviner en faisant un diff entre l'ancien et le nouvel etat
(ambigu : move de 5 ou swap ? qui a capture ? la carte jouee noyee dans la redistribution...).
Le serveur sait exactement ce qu'il vient d'executer -> il l'envoie.

```ts
// game.types.ts
export type GameEvent = {
    seat: Seat;           // qui a joue
    action: GameAction;   // quoi (type, cardId, pawnId...)
    captured: Pawn[];     // renvoyes au spawn
    newRound: boolean;    // cartes redistribuees dans ce tour ?
};

// sur le reseau
{ state: GameView, event: GameEvent | null }
```

- **`state` = la verite.** Apres les animations le front affiche exactement ca (reconnexion, animation ratee -> affichage quand meme juste).
- **`event` = un indice pour animer.** `null` quand il n'y a rien a animer (creation, join, reconnexion).

```ts
// front
socket.on('state', async ({ state, event }) => {
    if (event) {
        await animerCarteJouee(event.seat, event.action.cardId);
        await animerAction(event.action);
        for (const p of event.captured) await animerCapture(p);
        if (event.newRound) await animerDistribution();
    }
    afficher(state);
});
```

### Refacto a faire dans l'engine

`ActionResult` et `GameEvent` ne sont pas au meme niveau, on garde les deux :

| | `ActionResult` | `GameEvent` |
|---|---|---|
| Produit par | `applyAction` | `playTurn` |
| Contient | `pawns` (nouvel ETAT) + `captured` | `seat`, `action`, `captured`, `newRound` |
| Role | plomberie interne de l'engine | message pour le front |

-> `playTurn` renvoie `{ game: Game, event: GameEvent } | null` au lieu de `{ game, result }`,
et construit l'event avec `result.captured` + `seat` + `action` + `newRound` (vrai si `startRound` a ete appele).

## 6. Une view par joueur

### Cacher les mains -> SERVEUR (securite, obligatoire)

Tout ce qui part sur le reseau est lisible dans la console du navigateur.

```ts
export type PlayerView = Omit<Player, 'hand'> & { handCount: number };
export type GameView = Omit<Game, 'players' | 'drawPile'> & {
    mySeat: Seat;
    myHand: Card[];
    players: PlayerView[];
    drawPileCount: number;
};

// engine/view.ts (pure)
export function viewFor(game: Game, seat: Seat): GameView {
    const { drawPile, players, ...rest } = game;
    return {
        ...rest,
        mySeat: seat,
        myHand: players[seat].hand,
        players: players.map(({ hand, ...p }) => ({ ...p, handCount: hand.length })),
        drawPileCount: drawPile.length,
    };
}
```

`GameEvent` ne fuite rien : la carte jouee est de toute facon posee face visible sur la defausse.

### Se mettre en bas -> CLIENT (affichage)

```ts
const displaySeat = (seat: Seat) => mod(seat - view.mySeat, 4);               // 0 = en bas
const displayCell = (cell: number) => mod(cell - startCell(view.mySeat), 72); // plateau tourne
```

- Le serveur reste en coordonnees absolues : l'engine reste simple, et tout le monde parle la meme langue (logs, debug, tests).
- Les actions n'utilisent que des ids (`pawnId`, `cardId`), jamais des cases : rien a reconvertir quand le client joue.

**Le serveur decide ce que chacun a le droit de voir, le client decide comment l'afficher.**
