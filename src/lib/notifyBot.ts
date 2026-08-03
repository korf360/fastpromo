/**
 * Optional bridge: Next.js fulfillment → Discord bot Express logger.
 */
export async function notifyBotLogger(payload: {
  event: string;
  userId?: string;
  zoneId?: string;
  productId?: string;
  sessionId?: string;
  error?: string;
  message?: string;
}): Promise<void> {
  const base =
    process.env.BOT_WEBHOOK_URL?.replace(/\/$/, "") ||
    process.env.DISCORD_BOT_WEBHOOK_URL?.replace(/\/$/, "");

  if (!base) return;

  const url = base.includes("/api/webhooks/")
    ? base
    : `${base}/api/webhooks/stripe-moogold`;

  const secret = process.env.INTERNAL_WEBHOOK_SECRET?.trim();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-FastPromo-Secret": secret } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[notify-bot]", res.status, text);
    }
  } catch (err) {
    console.error("[notify-bot] failed:", err);
  }
}
