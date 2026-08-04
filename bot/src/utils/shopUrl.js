/**
 * Discord link buttons / thumbnails require a public https URL.
 * localhost or malformed SITE_URL causes the whole /prices reply to fail.
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function resolvePublicShopUrl(raw) {
  const fallback = "https://fastpromo-eta.vercel.app";
  const candidates = [raw, process.env.NEXT_PUBLIC_SITE_URL, process.env.SITE_URL, fallback];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    let cleaned = candidate.trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
    if (!cleaned) continue;
    try {
      const u = new URL(cleaned);
      if (u.protocol !== "https:") continue;
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") continue;
      return `${u.origin}${u.pathname}`.replace(/\/$/, "") || u.origin;
    } catch {
      // try next candidate
    }
  }

  return fallback;
}
