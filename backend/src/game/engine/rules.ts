import { Card } from "../game.types"

// REGLE DE PROTECTION (vaut pour tout le moteur)
// Un pion n'est protege que sur SA PROPRE case de depart, startCell(sonSeat) :
// la on ne peut ni le manger ni l'enjamber.
// Partout ailleurs il est mangeable, y compris sur la case de depart d'un autre.
// Donc sur MA case de depart, un pion adverse n'est jamais protege : il meurt.
// NB : "case de depart" = une case du plateau. A ne pas confondre avec
// zone: 'spawn', qui est le nid hors plateau.

export function canExit() : boolean {

	//est ce que la carte est un as ou un roi
		// si non return false
	//est ce que le pion est bien a moi et bien au nid (zone: 'spawn')
		// si non return false
	//est ce que ma case de depart est prise
	// -> pawnAt(startCell(player.Seat))
		//un pion a moi -> return false (on ne mange jamais un allie)
		//un pion adverse -> return true (jamais protege ici, il mourra)
	//case libre -> return true

	// la mise a mort est faite par applyAction, pas ici : canExit ne modifie rien
	return true;
}

export function canMove() : boolean {
	return true;
}

export function canSwap()

export function canEnterHome()


//TO DO LATER
//export function canSplit()
