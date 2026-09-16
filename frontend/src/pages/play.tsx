import { CardTable } from "@/game/CardTable";
import { usePlayerHand } from "@/game/usePlayerHand";
import { getCardMoveDistance } from "@/game/cardDeck";
import { PawnLayer } from "@/game/PawnLayer";
import { PlayerAvatars } from "@/game/PlayerAvatars";
import { usePawns } from "@/game/usePawns";
import { Header } from "@/components/Header";
import { paperStyle } from "@/lib/paperStyle";

import { Board } from "@/components/game/Board";

export default function Play() {
  const {
    cardsInHand,
    playedCards,
    isPlayingCard,
    isDeckEmpty,
    playCard,
    finishPlayingCard,
    startNewDeckAndDealAgain,
  } = usePlayerHand();

  const {
    pawns,
    pendingMoveDistance,
    selectablePawnIds,
    playCardOnPawns,
    choosePawn,
    finishPawnMove,
    resetPawns,
  } = usePawns();

  const isChoosingPawn = pendingMoveDistance > 0;

  function handlePlayCard(tableId: number) {
    const cardBeingPlayed = cardsInHand.find(
      (handCard) => handCard.tableId === tableId,
    );
    if (!cardBeingPlayed) return;

    playCard(tableId);
    playCardOnPawns(getCardMoveDistance(cardBeingPlayed.card));
  }

  function handleNewDeck() {
    startNewDeckAndDealAgain();
    resetPawns();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
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
      <button onClick={handleNewDeck} className="text-base font-bold">
        Nouveau paquet
      </button>

      {isDeckEmpty && <h1 className="text-3xl">Deck is empty!</h1>}

      {isChoosingPawn && (
        <h2 className="text-xl">Choisis un pion à faire avancer de {pendingMoveDistance} cases</h2>
      )}

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        {/* the cards sit inside the same box as the board, so they scroll and zoom with it */}
        <div style={{ position: "relative" }}>
          <Board>
            <PlayerAvatars />
            <PawnLayer
                pawns={pawns}
                selectablePawnIds={selectablePawnIds}
                moveDistance={pendingMoveDistance}
                onPawnClick={choosePawn}
                onPawnArrived={finishPawnMove}
            />
          </Board>
          <CardTable
              cardsInHand={cardsInHand}
              playedCards={playedCards}
              //the hand also waits while the player picks the pawn to move.
              isPlayingCard={isPlayingCard || isChoosingPawn}
              onPlayCard={handlePlayCard}
              onPlayedCardArrived={finishPlayingCard}
          />
        </div>
      </div>
    </main>
  );
}
