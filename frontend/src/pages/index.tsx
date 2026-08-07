"use client";
import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { Button } from "@/components/ui/button"
import { Circle } from "./shapes/Circle";
import { Board } from "./game/Board";
import { useState } from "react";
import { drawCard, resetDeck, getPath, type Card } from "./game/Cards";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});




export default function Home() {
  const [card, setCard] = useState<Card | null>(null);
  const [vide, setVide] = useState(false);

  function tirer() {
    const c = drawCard();
    if (!c) { setVide(true); return; }
    setCard(c);
  }

  return (
    <main style={{ padding: 24 }}>
      <button onClick={tirer}>Tirer une carte</button>
      <button onClick={() => { resetDeck(); setCard(null); setVide(false); }}>
        Nouveau paquet
      </button>

      {vide && <h1>Deck is empty!</h1>}
      {card && (
        <div>
          <p>{card.value} de {card.color}</p>
          <Image src={getPath(card)} width={250} height={400}
                 alt={`${card.value} de ${card.color}`} />
            {getPath(card)}
        </div>
      )}
    </main>
  );
}

// export default function Home() {
//   return (
//     <>
//       <main className="flex min-h-screen flex-col items-center justify-between p-24">
//         <Board/>
//         <DrawCard/>
//       </main>
//     </>
//   );
// }
