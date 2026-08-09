import { CardTable } from "@/components/game/CardTable";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { useViewportSize } from "@/hooks/useViewportSize";
import { Board } from "./game/Board";

export default function Play() {
  const viewportSize = useViewportSize();
  const {
    cardsInHand,
    playedCards,
    isPlayingCard,
    isDeckEmpty,
    playCard,
    finishPlayingCard,
    startNewDeckAndDealAgain,
  } = usePlayerHand();

  return (
    <main
      style={{ minHeight: "100vh", padding: 24, boxSizing: "border-box", // Paper
          backgroundColor: "#fdfcf8", // Very subtle paper texture
          backgroundImage: ` radial-gradient( circle at 20% 30%, rgba(0, 0, 0, 0.025) 0.5px, transparent 0.8px ), radial-gradient( circle at 70% 60%, rgba(0, 0, 0, 0.018) 0.5px, transparent 0.8px ), linear-gradient( 115deg, rgba(255,255,255,0.5), rgba(245,243,237,0.15) 45%, rgba(255,255,255,0.4) ) `, backgroundSize: ` 7px 7px, 11px 11px, 100% 100% `, // Slight paper feel
          color: "#29251f", // Make the content feel printed onto the sheet
          position: "relative", overflow: "hidden", }}
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
      <button onClick={startNewDeckAndDealAgain}>Nouveau paquet</button>

      {isDeckEmpty && <h1>Deck is empty!</h1>}

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        <CardTable
            cardsInHand={cardsInHand}
            playedCards={playedCards}
            isPlayingCard={isPlayingCard}
            viewportSize={viewportSize}
            onPlayCard={playCard}
            onPlayedCardArrived={finishPlayingCard}
        />
        <Board/>
      </div>
    </main>
  );
}