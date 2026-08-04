/**
 * Normalize fulfillment errors into admin-facing diagnostics for Discord /order.
 */

export type FailureCategory =
  | "config"
  | "supplier"
  | "player"
  | "network"
  | "payment"
  | "internal";

export type OrderFailureDiagnostics = {
  category: FailureCategory;
  reason: string;
  detail: string | null;
};

const DETAIL_MAX = 900;

export function truncateDetail(raw: unknown, max = DETAIL_MAX): string | null {
  if (raw == null) return null;
  const text =
    typeof raw === "string"
      ? raw
      : (() => {
          try {
            return JSON.stringify(raw);
          } catch {
            return String(raw);
          }
        })();
  const trimmed = text.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function diagnoseFulfillmentFailure(
  error: string,
  raw?: unknown
): OrderFailureDiagnostics {
  const msg = (error || "Unknown fulfillment error").trim();
  const lower = msg.toLowerCase();
  const detail = truncateDetail(raw) ?? truncateDetail(msg);

  if (
    lower.includes("sku env not set") ||
    lower.includes("moogoldproductid") ||
    lower.includes("misconfigured")
  ) {
    return {
      category: "config",
      reason:
        "Supplier product mapping is missing or misconfigured on the server (MooGold SKU env).",
      detail,
    };
  }

  if (
    lower.includes("missing or invalid session metadata") ||
    lower.includes("metadata")
  ) {
    return {
      category: "payment",
      reason:
        "Checkout session metadata was incomplete (player ID, zone, or product missing).",
      detail,
    };
  }

  if (
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  ) {
    return {
      category: "network",
      reason:
        "Could not reach the diamond supplier (network / timeout). Payment may still be captured — retry or refund from admin.",
      detail,
    };
  }

  if (
    lower.includes("user") ||
    lower.includes("zone") ||
    lower.includes("player") ||
    lower.includes("account") ||
    lower.includes("invalid id") ||
    lower.includes("not found")
  ) {
    return {
      category: "player",
      reason:
        "Supplier rejected the player User ID / Zone ID (invalid, wrong region, or account not found).",
      detail,
    };
  }

  if (
    lower.includes("moogold") ||
    lower.includes("supplier") ||
    lower.includes("api") ||
    lower.includes("order")
  ) {
    return {
      category: "supplier",
      reason:
        "Diamond supplier (MooGold) rejected or failed the top-up after payment was captured.",
      detail,
    };
  }

  return {
    category: "internal",
    reason: "Fulfillment failed after payment for an unexpected internal reason.",
    detail,
  };
}

export function categoryLabel(category: string | null | undefined): string {
  switch (category) {
    case "config":
      return "Server configuration";
    case "supplier":
      return "Supplier / MooGold";
    case "player":
      return "Player ID / Zone";
    case "network":
      return "Network / timeout";
    case "payment":
      return "Checkout metadata";
    case "internal":
      return "Internal error";
    default:
      return category || "Unknown";
  }
}

export function adminGuidance(category: string | null | undefined): string {
  switch (category) {
    case "config":
      return "Check MooGold SKU env vars on Vercel, then re-fulfill or refund.";
    case "player":
      return "Ask the user to confirm User ID + Zone ID. Re-deliver with correct IDs or refund.";
    case "network":
      return "Retry fulfillment if payment is paid; otherwise refund and ask the user to reorder.";
    case "supplier":
      return "Check MooGold dashboard / balance. Retry delivery or refund if stock/API is down.";
    case "payment":
      return "Inspect Stripe session metadata. Manual fulfillment may be required.";
    case "internal":
      return "Check Vercel webhook logs for this Stripe session, then retry or refund.";
    default:
      return "Review Stripe + webhook logs, then re-deliver or refund as appropriate.";
  }
}
