"use client";

import { useEffect, useState } from "react";
import {
  ANALYTICS_FEATURE_ENABLED,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
    }

    function openSettings() {
      const current = readCookieConsent();
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

  function acknowledgeEssential() {
    writeCookieConsent(false);
    setAnalytics(false);
    setVisible(false);
    setPrefsOpen(false);
  }

  function acceptAll() {
    writeCookieConsent(ANALYTICS_FEATURE_ENABLED);
    setAnalytics(ANALYTICS_FEATURE_ENABLED);
    setVisible(false);
    setPrefsOpen(false);
  }

  function savePrefs() {
    writeCookieConsent(analytics);
    setVisible(false);
    setPrefsOpen(false);
  }

  if (!visible) return null;

  return (
    <div
      className="cookie-banner fixed inset-x-0 bottom-0 z-[60] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
    >
      <div className="mx-auto max-w-3xl border border-white/10 bg-[#14171c]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <h2
          id="cookie-title"
          className="text-base font-semibold text-white sm:text-lg"
        >
          Cookies
        </h2>
        <p
          id="cookie-desc"
          className="mt-2 text-sm leading-relaxed text-white/60"
        >
          {ANALYTICS_FEATURE_ENABLED ? (
            <>
              We use essential cookies for secure login and checkout. Optional
              analytics cookies are only set if you choose them. See our{" "}
            </>
          ) : (
            <>
              We use only <strong className="text-white/80">essential</strong>{" "}
              cookies and local storage needed for security, sign-in, checkout,
              and remembering your preferences. We do{" "}
              <strong className="text-white/80">not</strong> use analytics or
              advertising cookies at this time. Full details in our{" "}
            </>
          )}
          <a
            href="/cookies"
            className="text-[#FFD700] underline-offset-2 hover:underline"
          >
            Cookie Policy
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-[#FFD700] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>

        {prefsOpen && (
          <div className="mt-4 space-y-3 border border-white/10 bg-black/20 p-4">
            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1"
                aria-describedby="cookie-essential-desc"
              />
              <span id="cookie-essential-desc">
                <strong className="text-white">Essential</strong> — session,
                security (CSRF), checkout continuity, and preference storage.
                Always on when you use the site.
              </span>
            </label>
            {ANALYTICS_FEATURE_ENABLED ? (
              <label className="flex items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 accent-[#FFD700]"
                />
                <span>
                  <strong className="text-white">Analytics</strong> — anonymous
                  usage metrics. Off by default; you can change this anytime.
                </span>
              </label>
            ) : (
              <p className="text-sm text-white/45">
                <strong className="text-white/70">Analytics / ads</strong> —
                not used. No optional cookies are available to enable.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {!prefsOpen ? (
            <>
              <button
                type="button"
                onClick={() => setPrefsOpen(true)}
                className="min-h-11 rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-white/40"
              >
                Cookie details
              </button>
              {ANALYTICS_FEATURE_ENABLED ? (
                <>
                  <button
                    type="button"
                    onClick={acknowledgeEssential}
                    className="min-h-11 rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-white/40"
                  >
                    Essential only
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="min-h-11 rounded-lg border border-[#FFD700]/50 bg-[#FFD700] px-4 py-2.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110"
                  >
                    Accept all
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={acknowledgeEssential}
                  className="min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15"
                >
                  OK, got it
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPrefsOpen(false)}
                className="min-h-11 rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white/80 transition-all duration-300 hover:border-white/40"
              >
                Back
              </button>
              {ANALYTICS_FEATURE_ENABLED ? (
                <>
                  <button
                    type="button"
                    onClick={acknowledgeEssential}
                    className="min-h-11 rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-white/40"
                  >
                    Reject optional
                  </button>
                  <button
                    type="button"
                    onClick={savePrefs}
                    className="min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15"
                  >
                    Save preferences
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={acknowledgeEssential}
                  className="min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15"
                >
                  OK, got it
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
