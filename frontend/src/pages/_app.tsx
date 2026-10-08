import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Fraunces, Public_Sans } from "next/font/google";

import { RequireLogin } from "@/components/auth/RequireLogin";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Les deux seules polices du design system, exposees aux tokens
          --font-heading / --font-body definis dans globals.css. */}
      <style jsx global>{`
        :root {
          --font-fraunces: ${fraunces.style.fontFamily};
          --font-public-sans: ${publicSans.style.fontFamily};
        }
      `}</style>
      <RequireLogin>
        <Component {...pageProps} />
      </RequireLogin>
    </>
  );
}
