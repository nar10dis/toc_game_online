# Norme de mise en page

Règles de mise en page communes à tout le code TypeScript du projet.
Elles ne concernent que la forme : jamais la logique.

---

## 1. Ordre dans un fichier

1. Imports
2. Constantes, en `MAJUSCULES`
3. La classe :
   1. champs
   2. constructeur
   3. fonctions de base, sans titre (`setBroadcaster`, `commit`…)
   4. sections, chacune sous son bandeau

Une fonction d'aide privée se place **juste sous** la fonction qui l'utilise.

```ts
async createGame(userId: number, pseudo: string) {
	...
	return await this.createGameInDb(userId, pseudo);
}

private async createGameInDb(userId: number, pseudo: string) {
	...
}
```

## 2. Bandeaux de section

- 76 caractères de large
- titre en `MAJUSCULES`, centré
- une ligne vide après le bandeau

```ts
	/* ********************************************************************** */
	/*                                 LOBBY                                  */
	/* ********************************************************************** */

	async createGame(userId: number, pseudo: string) {
```

## 3. Indentation et lignes vides

- Indentation en début de ligne : **tabulations**, une par niveau
- **Une seule** ligne vide entre deux fonctions
- **100 caractères** maximum par ligne

## 4. Espaces

| Oui | Non |
|---|---|
| `if (!game)` | `if(!game)` |
| `for (const p of players)` | `for(const p of players)` |
| `g => g.inviteCode` | `g=>g.inviteCode` |
| `fn: (game: Game) => void` | `fn : (game: Game) => void` |
| `userId: number, pseudo: string` | `userId: number,  pseudo: string` |

## 5. Accolades

L'accolade ouvrante est sur **la même ligne**.

```ts
async createGame(userId: number, pseudo: string) {
	...
}
```

Un `if` d'une seule instruction reste **sans accolades**.

```ts
if (!game)
	throw new NotFoundException('Game not found');
```

## 6. Objets

- **3 propriétés ou moins** : sur une ligne
- **Plus de 3** : une propriété par ligne

```ts
data: { gameId: dbGame.idGame, userId, seat: 0 },

this.logger.debug({
	gameId: game.id,
	seat: event.seat,
	action: event.action,
	winner: game.winner,
}, 'move played');
```

## 7. Commentaires

- `//` suivi d'un espace, **au-dessus** de la ligne commentée
- en français, sans accents
- seulement quand c'est utile : le *pourquoi* plutôt que le *quoi*
