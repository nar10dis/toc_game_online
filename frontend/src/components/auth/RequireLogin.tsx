import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";

import { getMe } from "@/api/user";

// Every other page needs a logged in user, so a new page is protected by default
const PUBLIC_PAGES = ["/login", "/register", "/rules", "/privacy", "/terms", "/404", "/_error"];

/** Sends to /login when nobody is logged in, and shows nothing until we know. */
export function RequireLogin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isPublic = PUBLIC_PAGES.includes(router.pathname);
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  useEffect(() => {
    if (isPublic) {
      return;
    }
    let isCancelled = false;
    getMe().then((me) => {
      if (isCancelled) {
        return;
      }
      if (!me) {
        router.replace("/login");
        return;
      }
      setCheckedPath(router.pathname);
    });
    return () => {
      isCancelled = true;
    };
  }, [isPublic, router]);

  if (!isPublic && checkedPath !== router.pathname) {
    return null;
  }
  return <>{children}</>;
}
