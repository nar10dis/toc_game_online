import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getMessage = async () => {
      const response = await fetch('/api/health');
      const data = await response.json();

      setMessage(data.message);
    }
    getMessage();
  }, []);

  return (
    <>
  <h1>Transcendence</h1>
  <p>{message}</p>
  </>
  );
}
