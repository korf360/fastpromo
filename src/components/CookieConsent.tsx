"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fp_cookie_consent_v1";

type Consent = {
  essential: true;
  analytics: boolean;
  updatedAt: string;
};

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    if (parsed && parsed.essential === true) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function writeConsent(analytics: boolean): Consent {
  const value: Consent = {
    essential: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("fp:consent", { detail: value }));
  return value;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
    }

    function openSettings() {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setPrefsOpen(true);
      setVisible(true);
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-open-cookie-settings]")) {
        e.preventDefault();
        openSettings();
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function acceptAll() {
    writeConsent(true);
    setVisible(false);
    setPrefsOpen(false);
  }

  function essentialOnly() {
    writeConsent(false);
    setVisible(false);
    setPrefsOpen(false);
  }

  function savePrefs() {
    writeConsent(analytics);
    setVisible(false);
    setPrefsOpen(false);
  }

  if (!visible) return null;

  return (
    <div
      className="cookie-banner fixed inset-x-0 bottom-0 z-[60] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
    >
      <div className="mx-auto max-w-3xl border border-white/10 bg-[#14171c]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <h2
          id="cookie-title"
          className="text-base font-semibold text-white sm:text-lg"
        >
          Cookies & privacy
        </h2>
        <p
          id="cookie-desc"
          className="mt-2 text-sm leading-relaxed text-white/60"
        >
          We use essential cookies to run secure checkout. Optional analytics
          cookies help us improve FastPromo. See our{" "}
          <a href="/cookies" className="text-[#FFD700] underline-offset-2 hover:underline">
            Cookie Policy
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-[#FFD700] underline-offset-2 hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        {prefsOpen && (
          <div className="mt-4 space-y-3 border border-white/10 bg-black/20 p-4">
            <label className="flex items-start gap-3 text-sm text-white/70">
              <input type="checkbox" checked disabled className="mt-1" />
              <span>
                <strong className="text-white">Essential</strong> — required for
                security, payments, and consent storage.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 accent-[#FFD700]"
              />
              <span>
                <strong className="text-white">Analytics</strong> — anonymous
                usage metrics to improve the product experience.
              </span>
            </label>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {!prefsOpen ? (
            <>
              <button
                type="button"
                onClick={() => setPrefsOpen(true)}
                className="min-h-11 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition-all duration-300 hover:border-white/30"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={essentialOnly}
                className="min-h-11 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-[#FFD700]/40"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="min-h-11 rounded-lg bg-[#FFD700] px-4 py-2.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110"
              >
                Accept all
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={essentialOnly}
                className="min-h-11 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={savePrefs}
                className="min-h-11 rounded-lg bg-[#FFD700] px-4 py-2.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110"
              >
                Save preferences
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
