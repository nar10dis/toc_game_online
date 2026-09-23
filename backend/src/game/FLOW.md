# Le trajet d'un coup — schéma

Aide-mémoire pour savoir **où écrire quoi** dans le module `game`.
`TYPES.md` décrit la forme des données ; ce fichier décrit leur circulation.

---

## 1. Les trois couches

```
   ┌──────────────────────────────────────────────────────────────┐
   │  FRONT                                                       │
   │  ne connaît que des ids et ce qu'on lui a montré             │
   └───────────────────────────┬──────────────────────────────────┘
                               │  HTTP  (JSON : des nombres et des chaînes)
   ════════════════════════════╪══════════════════════════════════════
                               │              FRONTIÈRE RÉSEAU
   ┌───────────────────────────▼──────────────────────────────────┐
   │  game.controller.ts        la porte d'entrée                 │
   │  - lit le cookie jwt (AuthGuard remplit req.user)            │
   │  - lit le body et le :code de l'url                          │
   │  - ne connaît AUCUNE règle du jeu                            │
   └───────────────────────────┬──────────────────────────────────┘
                               │  playAction(code, userId, action)
   ┌───────────────────────────▼──────────────────────────────────┐
   │  game.service.ts           le gardien de l'état              │
   │  - DÉTIENT  Map<inviteCode, Game>                            │
   │  - sort le Game, appelle le moteur, RANGE le nouveau Game    │
   │  - lève les exceptions Nest (404, 403, 400)                  │
   └───────────────────────────┬──────────────────────────────────┘
                               │  des objets, rien que des objets
   ════════════════════════════╪══════════════════════════════════════
                               │              FRONTIÈRE DU MOTEUR
   ┌───────────────────────────▼──────────────────────────────────┐
   │  engine/*.ts               les règles                        │
   │  - fonctions PURES : données en entrée, données en sortie    │
   │  - zéro import de @nestjs/*, zéro Map, zéro this             │
   │  - ne stocke rien, ne modifie rien : renvoie du neuf         │
   └──────────────────────────────────────────────────────────────┘
```

**Un seul endroit détient l'état : le service.**
Le contrôleur ne garde rien entre deux requêtes, le moteur non plus.

> Si un `import { Injectable } from '@nestjs/common'` apparaît dans `engine/`,
> c'est que de la logique est partie au mauvais endroit.

---

## 2. La frontière des ids

Le réseau ne transporte pas d'objets `Pawn` : il transporte des identifiants.
Et même s'il en transportait, on ne les croirait pas — un client bidouillé
enverrait un pion déjà arrivé à la maison.

```
   FRONT                          │  SERVEUR
   ───────────────────────────────┼──────────────────────────────────
   pawnId: 3                      │  { id: 3, playerSeat: 2,
   cardId: "heart_13"             │    position: { zone: 'spawn' } }
                                  │
   des ÉTIQUETTES                 │  les VRAIS objets, dans game.pawns
```

La traduction se fait **une seule fois, à l'entrée du moteur** :

| sens | qui | quoi |
|------|-----|------|
| id → objet | `isLegal`, `applyAction` | `findPawn(pawns, action.pawnId)`, `findCard(hand, action.cardId)` |
| objet → id | `getLegalActions`, `toPlayerView` | on ne renvoie au front que `pawnId`, `cardId` |

Derrière cette traduction, **toutes** les fonctions de règle travaillent avec
des objets (`canExit(pawns, card, pawn)`), jamais avec des ids. C'est ce qui les
rend lisibles et testables sans monter une partie complète.

---

## 3. Le processus digestif — un coup, de A à Z

Le joueur assis au siège 2 clique sur son pion pour sortir avec un Roi.

```
 ①  POST /api/game/AB12/action
     { type: 'exit', cardId: 'heart_13', pawnId: 3 }
         │
         ▼
 ②  AuthGuard          cookie jwt valide ?          sinon 401
         │             req.user = { sub: 7, ... }
         ▼
 ③  controller         récupère code = 'AB12', userId = 7, action = body
         │             gameService.playAction('AB12', 7, action)
         ▼
 ④  service            game = games.get('AB12')      sinon 404
         │             seat  = seatOf(game, 7)        → 2
         │             game.currentSeat === 2 ?       sinon 403
         ▼
 ⑤  isLegal            pawn = findPawn(game.pawns, 3)      ← id devient objet
     (legalMoves.ts)   card = findCard(hand, 'heart_13')   ← id devient objet
         │             pawn.playerSeat === seat ?
         │             canExit(game.pawns, card, pawn) ?   ← rules.ts
         │                                                   sinon 400
         ▼
 ⑥  applyAction        ne modifie PAS game : en construit un nouveau
     (apply.ts)        - le pion 3 passe en { zone:'board', cell: 36 }
         │             - l'adverse qui campait là repart en 'spawn'
         │             - la carte quitte la main, va dans discardPile
         │             - currentSeat passe au joueur suivant
         │             - winner si les 4 pions sont à la maison
         │
         │             renvoie { game: next, result: ActionResult }
         ▼                                     └── pour les ANIMATIONS du front
 ⑦  service            games.set('AB12', next)       ← le nouvel état remplace l'ancien
         │
         ▼
 ⑧  toPlayerView       ce que CE joueur a le droit de voir
     (view.ts)         - sa main, pas celles des autres (juste cardCount)
         │             - drawCount, pas drawPile
         │             - legalActions : recalculées sur le NOUVEL état
         │             - lastAction : le result de l'étape ⑥
         ▼
 ⑨  réponse HTTP       la PlayerView → le front anime et réaffiche
```

Les trois autres joueurs ne sont pas dans cette requête : ils découvrent le coup
à leur prochain `GET /view` (ou par un push WebSocket, plus tard).

---

## 4. Le trajet retour : `legalActions`

`legalActions` n'est **pas une route**. C'est un champ de la `PlayerView`,
recalculé à chaque lecture — la fonction est pure et rapide, inutile de la
stocker dans le `Game`.

```
   toPlayerView(game, seat, lastAction)
        │
        ├── seat === game.currentSeat  ──►  getLegalActions(game, seat)
        │                                   [ {type:'exit', cardId, pawnId}, ... ]
        │
        └── sinon                      ──►  []          « ce n'est pas ton tour »
```

Le front s'en sert **uniquement pour allumer** les bonnes cartes et les bons
pions. Ce n'est pas une autorisation : au clic, le serveur repasse par ⑤ et
revérifie tout. Un client modifié qui envoie une action absente de sa liste
se prend un `400`.

> D'où la règle : `getLegalActions` et `isLegal` doivent appeler **les mêmes**
> fonctions de `rules.ts`. Sinon le front affichera des coups jouables que le
> serveur refusera.

---

## 5. Qui a le droit de connaître quoi

| fichier | connaît | ne connaît pas |
|---------|---------|----------------|
| `game.controller.ts` | HTTP, cookies, codes d'erreur | les règles, la Map |
| `game.service.ts` | la Map, les exceptions Nest | les règles du jeu |
| `engine/state.ts` | `Game` entier | HTTP, la Map |
| `engine/legalMoves.ts` | `Game` entier | HTTP, la Map |
| `engine/apply.ts` | `Game` entier | HTTP, la Map |
| `engine/view.ts` | `Game` entier + un siège | HTTP, la Map |
| `engine/rules.ts` | `pawns`, `card`, `pawn` | le `Game`, le tour, les mains |
| `engine/board.ts` | `pawns`, `seat`, des cases | les cartes |
| `engine/deck.ts` | des cartes, des mains | les pions, le plateau |

Les fonctions « haut niveau » (ligne 3 à 6) prennent le `Game` entier parce
qu'elles ont besoin du tour, des mains et des pions à la fois.
Les fonctions de règle (ligne 7 à 9) prennent le strict minimum : c'est ce qui
permet de les tester avec deux pions bidons.

---

## 6. Les quatre règles d'or

1. **Le serveur est la seule source de vérité.** Le front propose, le moteur dispose.
2. **Le moteur ne mute rien.** On copie (`{ ...pawn }`, `[...cards]`) et on
   renvoie du neuf, comme `deck.ts` le fait déjà. Un coup refusé à mi-chemin ne
   doit jamais laisser une partie à moitié modifiée.
3. **Une seule traduction id → objet**, à la frontière du moteur.
4. **Tout ce qui est calculable n'est pas stocké** : `legalActions`, le nombre
   de cartes, le vainqueur se recalculent. Le `Game` ne garde que le brut.

---

## 7. Ordre d'écriture conseillé

```
   rules.ts        canExit → canMove → canEnterHome → canSwap
        │          (testable seul, sans Game, sans Nest)
        ▼
   legalMoves.ts   findPawn / findCard, getLegalActions, isLegal
        │
        ▼
   apply.ts        applyAction + ActionResult
        │
        ▼
   state.ts        createGame, startRound, nextTurn, checkWinner
        │
        ▼
   view.ts         toPlayerView
        │
        ▼
   game.service.ts / game.controller.ts / game.module.ts
        │          (+ l'enregistrer dans app.module.ts !)
        ▼
   ai.ts           le bot joue getLegalActions()[0] → partie testable en solo
```

Tout ce qui est au-dessus de `game.service.ts` s'écrit et se teste avec
`npm test`, sans docker, sans navigateur, sans base de données.
