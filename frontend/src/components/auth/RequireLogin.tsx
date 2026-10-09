import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";

import { getSession } from "@/api/auth";

// Every other page needs a logged in user, so a new page is protected by default
const PUBLIC_PAGES = ["/login", "/register", "/rules", "/privacy", "/terms", "/404", "/_error"];
// A logged in user has nothing to do on these, so they go straight to the menu
const GUEST_PAGES = ["/login", "/register"];

/** Sends to /login when nobody is logged in, to /menu when someone is logged in on a guest page, and shows nothing until we know. */
export function RequireLogin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isPublic = PUBLIC_PAGES.includes(router.pathname);
  const isGuest = GUEST_PAGES.includes(router.pathname);
  const needsCheck = !isPublic || isGuest;
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!needsCheck) {
      return;
    }
    let isCancelled = false;
    getSession().then((user) => {
      if (isCancelled) {
        return;
      }
      if (isGuest && user) {
        router.replace("/menu");
        return;
      }
      if (!isGuest && !user) {
        router.replace("/login");
        return;
      }
      setCheckedPath(router.pathname);
    });
    return () => {
      isCancelled = true;
    };
  }, [needsCheck, isGuest, router]);

  if (needsCheck && checkedPath !== router.pathname) {
    return null;
  }
  return <>{children}</>;
}
