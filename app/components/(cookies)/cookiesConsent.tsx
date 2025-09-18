// File: components/cookies/cookie-consent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useHasSavedConsent } from "@/hooks/useHasSavedConsent";

const CONSENT_COOKIE = "nedapay.cookieConsent.v1";

type Prefs = { necessary: boolean; analytics: boolean; };

function readConsent(): Prefs | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      necessary: Boolean(parsed.necessary),
      analytics: Boolean(parsed.analytics),
    };
  } catch {
    return null;
  }
}

export function CookieConsentModal() {
  const { user, getAccessToken } = usePrivy();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    analytics: false,
  });
  const { loading, hasConsent } = useHasSavedConsent();
  // console.log("hasConsent", hasConsent);  //debug

  // Show the modal if no consent cookie is present (except on /legal pages)
  const suppress = useMemo(() => pathname?.startsWith("/legal"), [pathname]);

  useEffect(() => {
    if (suppress) return;
    if (!loading) setOpen(!hasConsent); // open only if nothing saved
  }, [suppress, loading, hasConsent]);

  async function save(preferences: Prefs) {
    // optimistic local write to avoid flicker
    setPrefs(preferences);
    try {
      const tk = await getAccessToken();
      await fetch("/api/cookie-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tk}`,
        },
        body: JSON.stringify({ preferences }),
      });
    } catch (e) {
      console.error("Failed to persist cookie consent", e);
    } finally {
      setOpen(false);
    }
  }

  const acceptAll = () =>
    save({ necessary: true, analytics: true });
  const rejectNonEssential = () =>
    save({ necessary: true, analytics: false });
  const saveChoices = () => save(prefs);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg border-slate-700/60 bg-slate-950 text-slate-200 mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent text-lg sm:text-xl">
            Cookies & Privacy
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed">
            We use necessary cookies to make NedaPay work. With your consent, we
            will also use analytics to improve your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3 gap-2">
            <div className="flex-1">
              <p className="font-medium text-slate-100 text-sm">Necessary</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Required for basic site functionality.
              </p>
            </div>
            <Switch checked disabled className="self-start sm:self-center" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3 gap-2">
            <div className="flex-1">
              <p className="font-medium text-slate-100 text-sm">Analytics</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Helps us understand usage to improve the product.
              </p>
            </div>
            <Switch
              checked={prefs.analytics}
              onCheckedChange={(v) =>
                setPrefs((p) => ({ ...p, analytics: Boolean(v) }))
              }
              className="self-start sm:self-center"
            />
          </div>

          {/* <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div>
              <p className="font-medium text-slate-100">Marketing</p>
              <p className="text-sm text-slate-400">
                Personalized content/ads and measurement.
              </p>
            </div>
            <Switch
              checked={prefs.marketing}
              onCheckedChange={(v) =>
                setPrefs((p) => ({ ...p, marketing: Boolean(v) }))
              }
            />
          </div> */}
        </div>

        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400">
          Read more in our{" "}
          {/* <Link href="/legal/cookies" className="underline underline-offset-4">
            Cookie Policy
          </Link>{" "}
          and{" "} */}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </div>

        <Separator className="my-3 sm:my-4 bg-slate-800" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm py-2 px-3"
            onClick={rejectNonEssential}
          >
            Reject non‑essential
          </Button>
          <Button
            variant="outline"
            className="border-indigo-700/60 bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900/60 text-xs sm:text-sm py-2 px-3"
            onClick={saveChoices}
          >
            Save choices
          </Button>
          <Button
            className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white hover:opacity-90 text-xs sm:text-sm py-2 px-3"
            onClick={acceptAll}
          >
            Accept all
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
