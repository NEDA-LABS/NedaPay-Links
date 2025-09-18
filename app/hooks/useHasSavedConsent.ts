"use client";
import { useEffect, useState } from "react";
import {usePrivy} from "@privy-io/react-auth";

export function useHasSavedConsent() {
  const {user, getAccessToken} = usePrivy();
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const tk = await getAccessToken();
        const res = await fetch("/api/cookie-consent", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tk}`,
          },
          credentials: "include",
        });
        const json = await res.json();
        if (!active) return;
        // console.log("analytics",json.preferences?.analytics); //debug
        setHasConsent(Boolean(json?.preferences?.analytics || json?.preferences?.necessary));
      } catch {
        // fallback to cookie-only check
        try {
          const raw = document.cookie
            .split("; ")
            .find((row) => row.startsWith("nedapay.cookieConsent.v1="))
            ?.split("=")[1];
          setHasConsent(Boolean(raw));
        } catch {}
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);

  return { loading, hasConsent };
}
