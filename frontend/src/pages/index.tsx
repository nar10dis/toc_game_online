"use client";

import { Button } from "@/components/ui/button";
import { Geist, Geist_Mono } from "next/font/google";

import { useRouter } from "next/router";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function Home() {

  const router = useRouter();

  return (
    <main
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ minHeight: "100vh", padding: 24, boxSizing: "border-box", // Paper
          backgroundColor: "#fdfcf8", // Very subtle paper texture
          backgroundImage: ` radial-gradient( circle at 20% 30%, rgba(0, 0, 0, 0.025) 0.5px, transparent 0.8px ), radial-gradient( circle at 70% 60%, rgba(0, 0, 0, 0.018) 0.5px, transparent 0.8px ), linear-gradient( 115deg, rgba(255,255,255,0.5), rgba(245,243,237,0.15) 45%, rgba(255,255,255,0.4) ) `, backgroundSize: ` 7px 7px, 11px 11px, 100% 100% `, // Slight paper feel
          color: "#29251f", // Make the content feel printed onto the sheet
          position: "relative", overflow: "hidden", }}
    >
      <button onClick={() => router.push("/play")}>Play</button>
    </main>
  );
}
