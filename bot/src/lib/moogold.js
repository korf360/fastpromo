import { createHmac } from "node:crypto";

const MOOGOLD_BASE = "https://moogold.com/wp-json/v1/api";
const BALANCE_PATH = "user/balance";

/**
 * @param {string} payloadJson
 * @param {string} timestamp
 * @param {string} path
 * @param {string} secretKey
 */
function sign(payloadJson, timestamp, path, secretKey) {
  return createHmac("sha256", secretKey)
    .update(`${payloadJson}${timestamp}${path}`, "utf8")
    .digest("hex");
}

/**
 * Silent health ping against MooGold balance endpoint.
 * @returns {Promise<{ ok: boolean, detail: string }>}
 */
export async function pingMoogoldHealth() {
  const partnerId = process.env.MOOGOLD_PARTNER_ID?.trim();
  const secretKey = process.env.MOOGOLD_SECRET_KEY?.trim();

  if (!partnerId || !secretKey) {
    return { ok: false, detail: "MooGold credentials missing." };
  }

  const payloadObject = { path: BALANCE_PATH };
  const payloadJson = JSON.stringify(payloadObject);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const auth = sign(payloadJson, timestamp, BALANCE_PATH, secretKey);
  const basic = Buffer.from(`${partnerId}:${secretKey}`, "utf8").toString(
    "base64"
  );

  try {
    const res = await fetch(`${MOOGOLD_BASE}/${BALANCE_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        timestamp,
        auth,
        Authorization: `Basic ${basic}`,
      },
      body: payloadJson,
      signal: AbortSignal.timeout(12_000),
    });

    const raw = await res.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }

    if (!res.ok) {
      return {
        ok: false,
        detail: `HTTP ${res.status}: ${raw.slice(0, 200)}`,
      };
    }

    if (body && typeof body === "object") {
      const record = /** @type {Record<string, unknown>} */ (body);
      const status = String(record.status ?? record.message ?? "").toLowerCase();
      if (
        status.includes("out of stock") ||
        status.includes("insufficient") ||
        (status.includes("balance") && status.includes("error"))
      ) {
        return { ok: false, detail: status || "Supplier balance/stock issue." };
      }
      if (record.success === false || record.error) {
        return {
          ok: false,
          detail: String(record.error || record.message || "MooGold error"),
        };
      }
    }

    return { ok: true, detail: "MooGold reachable." };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
