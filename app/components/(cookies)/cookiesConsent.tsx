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

const CONSENT_COOKIE = "nedapay.cookieConsent.v1";

type Prefs = { necessary: boolean; analytics: boolean; marketing: boolean };

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
      marketing: Boolean(parsed.marketing),
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
    marketing: false,
  });

  // Show the modal if no consent cookie is present (except on /legal pages)
  const suppress = useMemo(() => pathname?.startsWith("/legal"), [pathname]);

  useEffect(() => {
    if (suppress) return; // don't show in legal section
    const existing = readConsent();
    if (!existing) setOpen(true);
  }, [suppress]);

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
    save({ necessary: true, analytics: true, marketing: true });
  const rejectNonEssential = () =>
    save({ necessary: true, analytics: false, marketing: false });
  const saveChoices = () => save(prefs);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-slate-700/60 bg-slate-950 text-slate-200">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
            Cookies & Privacy
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            We use necessary cookies to make NedaPay work. With your consent,
            we’d also use analytics and marketing cookies to improve your
            experience.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div>
              <p className="font-medium text-slate-100">Necessary</p>
              <p className="text-sm text-slate-400">
                Required for basic site functionality (cannot be turned off).
              </p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div>
              <p className="font-medium text-slate-100">Analytics</p>
              <p className="text-sm text-slate-400">
                Helps us understand usage to improve the product.
              </p>
            </div>
            <Switch
              checked={prefs.analytics}
              onCheckedChange={(v) =>
                setPrefs((p) => ({ ...p, analytics: Boolean(v) }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3">
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
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Read more in our{" "}
          <Link href="/legal/cookies" className="underline underline-offset-4">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </div>

        <Separator className="my-4 bg-slate-800" />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            onClick={rejectNonEssential}
          >
            Reject non‑essential
          </Button>
          <Button
            variant="outline"
            className="border-indigo-700/60 bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900/60"
            onClick={saveChoices}
          >
            Save choices
          </Button>
          <Button
            className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white hover:opacity-90"
            onClick={acceptAll}
          >
            Accept all
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
