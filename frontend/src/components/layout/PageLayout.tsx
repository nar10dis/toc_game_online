import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { paperStyle } from "@/lib/paperStyle";

/** The paper sheet with the header and footer, centred content: the shell every page shares. */
export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full flex-col overflow-clip" style={paperStyle}>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
