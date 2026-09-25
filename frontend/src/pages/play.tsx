import { CardTable } from "@/game/CardTable";
import { PawnLayer } from "@/game/PawnLayer";
import { PlayerAvatars } from "@/game/PlayerAvatars";
import { TurnControls } from "@/game/TurnControls";
import { toBoardPawns } from "@/game/boardPawns";
import { useGame } from "@/game/useGame";
import { useTurnChoice } from "@/game/useTurnChoice";
import { Header } from "@/components/layout/Header";
import { paperStyle } from "@/lib/paperStyle";

import { Board } from "@/components/game/Board";

export default function Play() {
  const { game, lastEvent, hasNoGame, sendAction } = useGame();
  const turnChoice = useTurnChoice(game, sendAction);

  let content = <h2 className="text-xl">Connexion...</h2>;
  if (hasNoGame) {
    content = <h2 className="text-xl">Tu n&apos;es dans aucune partie.</h2>;
  }

  if (game) {
    const isMyTurn = game.phase === "playing" && game.currentSeat === game.mySeat;
    const playerNames = game.players.map((player) => player.pseudo);

    // the dotted preview only makes sense for a plain move
    let previewDistance = 0;
    if (turnChoice.playMode === "move") {
      previewDistance = turnChoice.selectedCardValue;
    }

    content = (
      <>
        <TurnControls game={game} turnChoice={turnChoice} />

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* the cards sit inside the same box as the board, so they scroll and zoom with it */}
          <div style={{ position: "relative" }}>
            <Board>
              <PlayerAvatars playerNames={playerNames} />
              <PawnLayer
                pawns={toBoardPawns(game.pawns, lastEvent)}
                selectablePawnIds={turnChoice.selectablePawnIds}
                moveDistance={previewDistance}
                onPawnClick={turnChoice.handlePawnClick}
              />
            </Board>
            <CardTable
              hand={game.myHand}
              discardPile={game.discardPile}
              selectedCardId={turnChoice.selectedCardId}
              canPickCard={isMyTurn}
              onCardClick={turnChoice.handleCardClick}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        boxSizing: "border-box",
        position: "relative",
        overflow: "clip",
        ...paperStyle,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
        radial-gradient(
          ellipse at center,
          transparent 55%,
          rgba(60, 45, 30, 0.035) 100%
        )
      `,
        }}
      />
      <Header />
      {content}
    </main>
  );
}
