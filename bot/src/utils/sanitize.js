/** Digits-only MLBB identifiers */
const ID_PATTERN = /^[0-9]{1,20}$/;

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function sanitizePlayerId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * @param {string} username
 */
export function sanitizeChannelUsername(username) {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 20) || "user";
}

/**
 * @param {string} input
 * @returns {number | null}
 */
export function parseDurationMs(input) {
  const raw = input.trim().toLowerCase();
  const match = raw.match(/^(\d+)\s*(s|sec|secs|m|min|mins|h|hr|hrs|d|day|days)?$/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = match[2] || "m";
  if (unit.startsWith("s")) return n * 1000;
  if (unit.startsWith("h")) return n * 60 * 60 * 1000;
  if (unit.startsWith("d")) return n * 24 * 60 * 60 * 1000;
  return n * 60 * 1000;
}

/**
 * @param {number} max exclusive upper bound
 */
export function randomDigits(max = 10000) {
  return String(Math.floor(Math.random() * max)).padStart(4, "0");
}
