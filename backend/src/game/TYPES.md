# Types du jeu — schéma

Aide-mémoire pour rédiger les types du module `game`. Aucune logique ici : juste la forme des données.

```
                         ┌──────────────────────────────┐
                         │          GameState           │   connu du SERVEUR seulement
                         │  (l'état complet d'une partie)│
                         └──────────────┬───────────────┘
            ┌───────────────┬───────────┼────────────┬──────────────┐
            ▼               ▼           ▼            ▼              ▼
        Player[]         Pawn[]      Card[]       Card[]      GamePhase
        (4 joueurs)     (16 pions)   pioche      défausse
            │               │
            ▼               ▼
         Card[]       PawnPosition
         (main)       spawn | board | home


   CLIENT ──── GameAction ────►  MOTEUR  ──── ActionResult + PlayerView ────► CLIENT
             « ce que je veux    valide,      « ce qui s'est passé »
               faire »           applique     « ce que TU as le droit de voir »
```

---

## 1. `CardColor`
Une des 4 couleurs : `"heart" | "diamond" | "club" | "spade"`.

## 2. `Card`
| Champ   | Type        | Rôle                                        |
|---------|-------------|---------------------------------------------|
| `color` | `CardColor` | la couleur                                  |
| `value` | 1 → 13      | 1 = As, 11 = Valet, 12 = Dame, 13 = Roi      |

Identifiant : `color_value` (ex. `heart_7`), unique car un seul paquet.

## 3. `PawnPosition`  ← union discriminée
Un pion est dans **une seule** de ces situations :

```
┌─────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ zone: "spawn"       │  │ zone: "board"           │  │ zone: "home"            │
│                     │  │ cell: 0 → 71            │  │ cell: 0 → 3             │
│ (zone de départ)    │  │ (case absolue du tour)  │  │ (case dans la maison)   │
└─────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

## 4. `Pawn`
| Champ      | Type           | Rôle                                   |
|------------|----------------|----------------------------------------|
| `id`       | number         | stable toute la partie                 |
| `seat`     | 0 → 3          | à quel joueur il appartient            |
| `position` | `PawnPosition` | où il est                              |

## 5. `Player`
| Champ         | Type    | Rôle                                            |
|---------------|---------|-------------------------------------------------|
| `userId`      | number  | id en base, pour retrouver le joueur            |
| `name`        | string  | pseudo affiché                                  |
| `seat`        | 0 → 3   | place à la table : sortie, maison, ordre du tour |
| `hand`        | Card[]  | ses cartes (0 à 5)                              |
| `isConnected` | boolean | gestion des déconnexions                        |

## 6. `GamePhase`
`"waiting" | "playing" | "finished"`

## 7. `GameState`
| Champ         | Type          | Rôle                                   |
|---------------|---------------|----------------------------------------|
| `id`          | string        | id de la partie                        |
| `phase`       | `GamePhase`   | où en est la partie                    |
| `players`     | `Player[]`    | les 4 joueurs                          |
| `pawns`       | `Pawn[]`      | les 16 pions                           |
| `deck`        | `Card[]`      | pioche (cachée)                        |
| `discardPile` | `Card[]`      | cartes jouées ou défaussées            |
| `currentSeat` | 0 → 3         | à qui c'est le tour                    |
| `winnerSeat`  | 0 → 3 ou null | vainqueur                              |

⚠️ Rien de calculable ici (pas de coups légaux, pas de compteurs) : le moteur les calcule.

## 8. `GameAction`  ← union discriminée, envoyée par le client
```
┌──────────────────┬─────────────────────────────────────────────────────────┐
│ type             │ contenu                                                 │
├──────────────────┼─────────────────────────────────────────────────────────┤
│ "move"           │ card + pawnId           (avancer, ou reculer avec un 4)  │
│ "exit"           │ card + pawnId           (As ou Roi, pion en zone départ) │
│ "swap"           │ card + pawnIdA + pawnIdB (Valet)                         │
│ "split"          │ card + steps[]          (7 : 1 à 4 × { pawnId, steps },  │
│                  │                          total = 7)                      │
│ "discard"        │ card                    (aucun coup possible)            │
└──────────────────┴─────────────────────────────────────────────────────────┘
```
Le type décrit la **forme**. La **légalité** (bonne carte, bon tour, total = 7…) est vérifiée par le moteur.

## 9. `ActionResult`  ← pour les animations du front
| Champ        | Type                          | Rôle                             |
|--------------|-------------------------------|----------------------------------|
| `seat`       | 0 → 3                         | qui a joué                       |
| `card`       | `Card`                        | carte jouée                      |
| `moves`      | `{ pawnId, from, to }[]`      | déplacements, dans l'ordre       |
| `knockedOut` | `number[]` (pawnIds)          | pions renvoyés en zone de départ |

## 10. `PlayerView`  ← envoyée à UN joueur
Comme `GameState`, sauf :
```
GameState                         PlayerView
─────────                         ──────────
players[].hand (toutes)    ──►    myHand         (seulement la sienne)
                           ──►    players[].cardCount (les autres)
deck                       ──►    deckCount
                           +      legalActions   (si c'est son tour)
                           +      lastAction     (ActionResult | null)
```

---

**Ordre de rédaction :** `CardColor` → `Card` → `PawnPosition` → `Pawn` → `Player` → `GamePhase` → `GameState` → `GameAction` → `ActionResult` → `PlayerView`.
