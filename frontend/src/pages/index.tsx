"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { paperStyle } from "@/lib/paperStyle";


export default function Home() {
  const router = useRouter();

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
      <Header />
      <Button onClick={() => router.push("/menu")}>Play</Button>
      <h1 className="text-2xl">Do u hace an account ?</h1>
      <Button onClick={() => router.push("/login")}>Login</Button>
      <h1 className="text-2xl">DNo i want to create one !</h1>
      <Button onClick={() => router.push("/register")}>Rogin</Button>

    </main>
  );
}
