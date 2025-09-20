// File: components/cookies/cookie-consent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, Cookie, Settings } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    analytics: false,
  });
  const { loading, hasConsent } = useHasSavedConsent();

  // Show the modal if no consent cookie is present (except on /legal pages)
  const suppress = useMemo(() => pathname?.startsWith("/legal"), [pathname]);

  useEffect(() => {
    if (suppress) return;
    if (!loading && !hasConsent) setOpen(true);
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

  const acceptAll = () => {
    save({ necessary: true, analytics: true });
  };

  const rejectNonEssential = () => {
    save({ necessary: true, analytics: false });
  };

  const saveChoices = () => {
    save(prefs);
  };

  const handleCustomizeClick = () => {
    setExpanded(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
          expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setExpanded(false)}
      />
      
      {/* Cookie Banner */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className={`
          bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-2xl
          transition-all duration-500 ease-out transform
          ${expanded ? 'translate-y-0' : 'translate-y-0'}
        `}>
          {/* Collapsed State */}
          <div className={`px-4 sm:px-6 py-4 ${expanded ? 'border-b border-gray-200/50' : ''}`}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Cookie Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <Cookie className="w-5 h-5 text-indigo-600" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        We use necessary cookies to make NedaPay work. With your consent, we'll also use analytics to improve your experience.{' '}
                        <Link href="/privacy-policy" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                          Privacy Policy
                        </Link>
                      </p>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCustomizeClick}
                        className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 h-auto"
                      >
                        <Settings className="w-3 h-3 mr-1.5" />
                        Customize
                      </Button>
                      <Button
                        onClick={acceptAll}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 h-auto text-xs font-medium"
                      >
                        Accept All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded State */}
          <div className={`
            overflow-hidden transition-all duration-500 ease-out
            ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="px-4 sm:px-6 py-4">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </div>

                {/* Cookie Categories */}
                <div className="space-y-4 mb-6">
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-200/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">Necessary Cookies</h4>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Always Active</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Required for basic site functionality and security.
                      </p>
                    </div>
                    <Switch checked disabled className="ml-3" />
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-200/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Analytics Cookies</h4>
                      <p className="text-xs text-gray-600">
                        Help us understand usage patterns to improve the product.
                      </p>
                    </div>
                    <Switch
                      checked={prefs.analytics}
                      onCheckedChange={(v) =>
                        setPrefs((p) => ({ ...p, analytics: Boolean(v) }))
                      }
                      className="ml-3"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={rejectNonEssential}
                    className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 h-auto"
                  >
                    Reject Non-Essential
                  </Button>
                  <Button
                    onClick={saveChoices}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 h-auto text-xs font-medium"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
