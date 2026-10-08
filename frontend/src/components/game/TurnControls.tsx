import { TEAM_COLORS } from "@/lib/game/boardGeometry";
import type { GameView } from "@/lib/game/gameTypes";
import { SeatBadge } from "@/components/game/SeatBadge";
import type { TurnChoice } from "@/hooks/useTurnChoice";

type TurnControlsProps = {
  game: GameView;
  turnChoice: TurnChoice;
};

/** Whose turn it is, and what to click next. */
export function TurnControls({ game, turnChoice }: TurnControlsProps) {
  const currentPlayer = game.players[game.currentSeat];
  const isMyTurn = game.currentSeat === game.mySeat;

  if (game.phase === "finished" && game.winner !== null) {
    return <h2 className="text-2xl font-bold wrap-anywhere">{game.players[game.winner].pseudo} a gagné !</h2>;
  }

  // the demon of whoever plays, in its colour, like the one pulsing on the board
  const name = (
    <span className="font-bold wrap-anywhere" style={{ color: TEAM_COLORS[game.currentSeat] }}>
      {currentPlayer.pseudo}
    </span>
  );

  if (!isMyTurn) {
    let waitingText = <>Tour de {name}...</>;
    if (!currentPlayer.isConnected) {
      waitingText = <>{name} est parti, l&apos;IA joue à sa place...</>;
    }

    return (
      <div className="flex items-center gap-3">
        <SeatBadge seat={game.currentSeat} isTaken className="size-14 shrink-0" />
        <h2 className="text-xl">{waitingText}</h2>
      </div>
    );
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
      <div className="flex items-center gap-3">
        <SeatBadge seat={game.mySeat} isTaken className="size-14 shrink-0" />
        <h2 className="text-xl font-bold">{hint}</h2>
      </div>

      {turnChoice.errorMessage && (
        <p className="text-sm text-destructive">Refusé : {turnChoice.errorMessage}</p>
      )}
    </div>
  );
}
