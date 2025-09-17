"use client";

import { useEffect, useState } from "react";

interface ConsentPrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function useCookieConsentCheck() {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState<ConsentPrefs | null>(null);

  useEffect(() => {
    async function check() {
      try {
        // First check client cookie
        const cookieVal = document.cookie
          .split("; ")
          .find((row) => row.startsWith("nedapay.cookieConsent.v1="))
          ?.split("=")[1];
        if (cookieVal) {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookieVal));
            setConsent(parsed);
            setLoading(false);
            return;
          } catch {}
        }

        // If no cookie, ask API if DB has a record for this user
        const res = await fetch("/api/cookie-consent/check", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setConsent(data.preferences);
          } else {
            setConsent(null);
          }
        }
      } catch (e) {
        console.error("Failed to check cookie consent", e);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  return { consent, loading };
}
