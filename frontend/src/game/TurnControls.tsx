import { Button } from "@/components/ui/button";
import type { GameView } from "@/game/gameTypes";
import type { TurnChoice } from "@/game/useTurnChoice";

type TurnControlsProps = {
  game: GameView;
  turnChoice: TurnChoice;
};

/** Whose turn it is, and the buttons to choose what the selected card does. */
export function TurnControls({ game, turnChoice }: TurnControlsProps) {
  const currentPlayer = game.players[game.currentSeat];
  const isMyTurn = game.currentSeat === game.mySeat;

  if (game.phase === "finished" && game.winner !== null) {
    return <h2 className="text-2xl font-bold">{game.players[game.winner].pseudo} a gagné !</h2>;
  }

  if (!isMyTurn) {
    return <h2 className="text-xl">Tour de {currentPlayer.pseudo}...</h2>;
  }

  let hint = "À toi ! Choisis une carte.";
  if (turnChoice.selectedCardId) {
    hint = "Choisis un pion.";
  }
  if (turnChoice.playMode === "swap" && turnChoice.firstSwapPawnId !== null) {
    hint = "Choisis le pion avec qui échanger.";
  }
  if (turnChoice.isSplitInProgress) {
    hint = `Continue ton 7 : il reste ${turnChoice.splitLeft} pas.`;
  }

  // the 7 can be split: one button per number of steps still to play
  const splitStepChoices: number[] = [];
  for (let steps = 1; steps <= turnChoice.splitLeft; steps++) {
    splitStepChoices.push(steps);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <h2 className="text-xl font-bold">{hint}</h2>

      {turnChoice.isSplitting && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Pas :</span>
          {splitStepChoices.map((steps) => (
            <Button
              key={steps}
              size="sm"
              variant={turnChoice.splitSteps === steps ? "default" : "outline"}
              onClick={() => turnChoice.changeSplitSteps(steps)}
            >
              {steps}
            </Button>
          ))}
        </div>
      )}

      {(turnChoice.selectedCardId || turnChoice.isSplitInProgress) && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={turnChoice.playMode === "move" ? "default" : "outline"}
            onClick={() => turnChoice.changePlayMode("move")}
          >
            Avancer / sortir
          </Button>
          <Button
            variant={turnChoice.playMode === "enter" ? "default" : "outline"}
            onClick={() => turnChoice.changePlayMode("enter")}
          >
            Rentrer à la maison
          </Button>
          {/* only the jack swaps two pawns */}
          {turnChoice.selectedCardValue === 11 && (
            <Button
              variant={turnChoice.playMode === "swap" ? "default" : "outline"}
              onClick={() => turnChoice.changePlayMode("swap")}
            >
              Échanger
            </Button>
          )}
          {!turnChoice.isSplitInProgress && (
            <Button variant="destructive" onClick={turnChoice.handleDiscard}>
              Défausser
            </Button>
          )}
        </div>
      )}

      {turnChoice.errorMessage && (
        <p className="text-sm text-destructive">Refusé : {turnChoice.errorMessage}</p>
      )}
    </div>
  );
}
