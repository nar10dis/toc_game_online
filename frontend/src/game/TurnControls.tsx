import type { GameView } from "@/game/gameTypes";
import type { TurnChoice } from "@/game/useTurnChoice";

type TurnControlsProps = {
  game: GameView;
  turnChoice: TurnChoice;
};

/** Whose turn it is, and what to click next. */
export function TurnControls({ game, turnChoice }: TurnControlsProps) {
  const currentPlayer = game.players[game.currentSeat];
  const isMyTurn = game.currentSeat === game.mySeat;

  if (game.phase === "finished" && game.winner !== null) {
    return <h2 className="text-2xl font-bold">{game.players[game.winner].pseudo} a gagné !</h2>;
  }

  if (!isMyTurn) {
    return <h2 className="text-xl">Tour de {currentPlayer.pseudo}...</h2>;
  }

  const isJack = turnChoice.selectedCardValue === 11;

  let hint = "À toi ! Choisis une carte.";
  if (turnChoice.selectedCardId) {
    hint = "Choisis un pion.";
  }
  if (turnChoice.isSplitInProgress) {
    hint = `Continue ton 7 : il reste ${turnChoice.splitLeft} pas.`;
  }
  if (isJack && turnChoice.selectedPawnId !== null) {
    hint = "Choisis le pion avec qui échanger.";
  }
  if (turnChoice.destinations.length > 0) {
    hint = "Choisis la case où aller.";
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <h2 className="text-xl font-bold">{hint}</h2>

      {turnChoice.errorMessage && (
        <p className="text-sm text-destructive">Refusé : {turnChoice.errorMessage}</p>
      )}
    </div>
  );
}
