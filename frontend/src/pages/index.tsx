"use client";

import { Geist, Geist_Mono } from "next/font/google";

import { CardTable } from "@/game/CardTable";
import { usePlayerHand } from "@/game/usePlayerHand";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function Home() {
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
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ padding: 24, minHeight: "100vh" }}
    >
      <button onClick={startNewDeckAndDealAgain}>Nouveau paquet</button>

      {isDeckEmpty && <h1>Deck is empty!</h1>}

      <CardTable
        cardsInHand={cardsInHand}
        playedCards={playedCards}
        isPlayingCard={isPlayingCard}
        onPlayCard={playCard}
        onPlayedCardArrived={finishPlayingCard}
      />
    </main>
  );
}
