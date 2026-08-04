/**
 * Client consent helpers for FastPromo.
 * Flip ANALYTICS_FEATURE_ENABLED only when a real analytics script is wired
 * and gated behind hasAnalyticsConsent().
 */

export const CONSENT_STORAGE_KEY = "fp_cookie_consent_v2";
export const CONSENT_VERSION = 2 as const;

/** Soft-launch notice dismiss preference (localStorage, essential UX). */
export const PILOT_BANNER_STORAGE_KEY = "fp_pilot_banner_dismissed_v1";

/**
 * Set to true only after an analytics provider is integrated and scripts are
 * blocked until hasAnalyticsConsent() returns true.
 */
export const ANALYTICS_FEATURE_ENABLED = false;

export type CookieConsentState = {
  version: typeof CONSENT_VERSION;
  essential: true;
  analytics: boolean;
  updatedAt: string;
};

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed?.essential !== true || parsed.version !== CONSENT_VERSION) {
      return null;
    }
    return {
      version: CONSENT_VERSION,
      essential: true,
      analytics: Boolean(parsed.analytics),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  analytics: boolean
): CookieConsentState {
  const value: CookieConsentState = {
    version: CONSENT_VERSION,
    essential: true,
    analytics: ANALYTICS_FEATURE_ENABLED ? analytics : false,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("fp:consent", { detail: value }));
  return value;
}

/** True only when analytics is both enabled in product and consented. */
export function hasAnalyticsConsent(): boolean {
  if (!ANALYTICS_FEATURE_ENABLED) return false;
  return readCookieConsent()?.analytics === true;
}
