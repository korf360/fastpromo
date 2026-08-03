import { createHmac } from "crypto";

const MOOGOLD_BASE = "https://moogold.com/wp-json/v1/api";
const CREATE_ORDER_PATH = "order/create_order";

export type MoogoldCreateOrderInput = {
  userId: string;
  zoneId: string;
  moogoldProductId: string;
  partnerOrderId: string;
  quantity?: string;
};

export type MoogoldCreateOrderResult =
  | {
      ok: true;
      status: number;
      body: unknown;
      raw: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      body: unknown;
      raw: string;
    };

/**
 * Official MooGold auth:
 * auth = HMAC-SHA256( payloadJson + timestamp + path , SECRET_KEY )
 * Authorization = Basic base64(PARTNER_ID:SECRET_KEY)
 *
 * @see https://doc.moogold.com/
 */
export function signMoogoldRequest(
  payloadJson: string,
  timestamp: string,
  path: string,
  secretKey: string
): string {
  const stringToSign = `${payloadJson}${timestamp}${path}`;
  return createHmac("sha256", secretKey)
    .update(stringToSign, "utf8")
    .digest("hex");
}

function getMoogoldCredentials(): {
  partnerId: string;
  secretKey: string;
  category: string;
} | null {
  const partnerId = process.env.MOOGOLD_PARTNER_ID?.trim();
  const secretKey = process.env.MOOGOLD_SECRET_KEY?.trim();
  if (!partnerId || !secretKey) return null;

  const category =
    process.env.MOOGOLD_CATEGORY_ID?.trim() ||
    "50"; /* Direct top-up category per MooGold docs */

  return { partnerId, secretKey, category };
}

export async function createMoogoldOrder(
  input: MoogoldCreateOrderInput
): Promise<MoogoldCreateOrderResult> {
  const creds = getMoogoldCredentials();
  if (!creds) {
    return {
      ok: false,
      status: 0,
      error: "MOOGOLD_PARTNER_ID or MOOGOLD_SECRET_KEY is not configured.",
      body: null,
      raw: "",
    };
  }

  const payloadObject = {
    path: CREATE_ORDER_PATH,
    data: {
      category: creds.category,
      "product-id": input.moogoldProductId,
      quantity: input.quantity ?? "1",
      "User ID": input.userId,
      Server: input.zoneId,
    },
    partnerOrderId: input.partnerOrderId,
  };

  // Stable JSON — signature must match the exact body bytes sent.
  const payloadJson = JSON.stringify(payloadObject);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const auth = signMoogoldRequest(
    payloadJson,
    timestamp,
    CREATE_ORDER_PATH,
    creds.secretKey
  );
  const basic = Buffer.from(
    `${creds.partnerId}:${creds.secretKey}`,
    "utf8"
  ).toString("base64");

  const response = await fetch(`${MOOGOLD_BASE}/${CREATE_ORDER_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      timestamp,
      auth,
      Authorization: `Basic ${basic}`,
    },
    body: payloadJson,
  });

  const raw = await response.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }

  const success = isMoogoldSuccess(response.status, body);
  if (!success) {
    return {
      ok: false,
      status: response.status,
      error: extractMoogoldError(body, raw),
      body,
      raw,
    };
  }

  return { ok: true, status: response.status, body, raw };
}

function isMoogoldSuccess(httpStatus: number, body: unknown): boolean {
  if (httpStatus < 200 || httpStatus >= 300) return false;
  if (!body || typeof body !== "object") return httpStatus === 200;

  const record = body as Record<string, unknown>;
  if (typeof record.status === "string") {
    const s = record.status.toLowerCase();
    if (["error", "failed", "fail"].includes(s)) return false;
  }
  if (typeof record.code === "number" && record.code !== 0 && record.code !== 200) {
    return false;
  }
  if (typeof record.err_code === "number" && record.err_code !== 0) return false;
  if (typeof record.error === "string" && record.error.length > 0) return false;
  if (record.success === false) return false;

  return true;
}

function extractMoogoldError(body: unknown, raw: string): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["message", "error", "msg", "status_message", "detail"]) {
      const val = record[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  if (typeof body === "string" && body.trim()) return body.trim();
  if (raw.trim()) return raw.trim().slice(0, 500);
  return "Unknown MooGold fulfillment error.";
}
