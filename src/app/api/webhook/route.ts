import { after } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  buildAdminPing,
  buildFailureEmbed,
  buildSuccessEmbed,
  sendDiscordAudit,
} from "@/lib/discord";
import { createMoogoldOrder } from "@/lib/moogold";
import { notifyBotLogger } from "@/lib/notifyBot";
import { markOrderStatus, recordOrderAndCashback } from "@/lib/orders";
import {
  isProductId,
  PRODUCT_CATALOG,
  resolveMoogoldProductId,
  type ProductId,
} from "@/lib/products";

export const runtime = "nodejs";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    console.error(
      "[webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET."
    );
    return NextResponse.json(
      { ok: false, error: "Webhook misconfigured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = Buffer.from(await request.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    after(() => {
      void fulfillCheckoutSession(session).catch((err) => {
        console.error("[webhook] Unhandled fulfillment error:", err);
      });
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.userId?.trim();
  const zoneId = metadata.zoneId?.trim();
  const productIdRaw = metadata.productId?.trim();
  const authUserId = metadata.authUserId?.trim();
  const cashbackAppliedCents = Number(metadata.cashbackAppliedCents || "0") || 0;
  const promoCodeId = metadata.promoCodeId?.trim() || null;
  const promoCodeSnapshot = metadata.promoCode?.trim() || null;
  const promoDiscountCents = Number(metadata.promoDiscountCents || "0") || 0;
  const amountPaidCents =
    typeof session.amount_total === "number"
      ? session.amount_total
      : Number(metadata.catalogPriceCents || "0") || 0;

  if (!userId || !zoneId || !productIdRaw || !isProductId(productIdRaw)) {
    const error =
      "Missing or invalid session metadata (userId, zoneId, productId).";
    console.error("[webhook]", error, metadata);
    await sendDiscordAudit({
      content: buildAdminPing(),
      embeds: [
        buildFailureEmbed({
          userId: userId ?? "unknown",
          zoneId: zoneId ?? "unknown",
          productName: productIdRaw ?? "unknown",
          productId: productIdRaw ?? "unknown",
          sessionId: session.id,
          error,
        }),
      ],
    });
    return;
  }

  const productId = productIdRaw as ProductId;
  const product = PRODUCT_CATALOG[productId];

  if (authUserId) {
    try {
      const orderRow = await recordOrderAndCashback({
        authUserId,
        stripeSessionId: session.id,
        productId,
        productLabel: product.name,
        mlbbUserId: userId,
        mlbbZoneId: zoneId,
        amountPaidCents,
        cashbackAppliedCents,
        promoCodeId,
        promoCodeSnapshot,
        promoDiscountCents,
        status: "paid",
      });

      void import("@/lib/email").then(({ sendOrderReceiptEmail }) =>
        sendOrderReceiptEmail(orderRow.id).catch((err) => {
          console.error("[webhook] receipt email failed:", err);
        })
      );
    } catch (err) {
      console.error("[webhook] order/cashback record failed:", err);
    }
  }

  const moogoldProductId = resolveMoogoldProductId(productId);

  if (!moogoldProductId) {
    const error = `MooGold SKU env not set for ${product.moogoldEnvKey}.`;
    console.error("[webhook]", error);
    if (authUserId) await markOrderStatus(session.id, "failed");
    await sendDiscordAudit({
      content: buildAdminPing(),
      embeds: [
        buildFailureEmbed({
          userId,
          zoneId,
          productName: product.name,
          productId,
          sessionId: session.id,
          error,
        }),
      ],
    });
    return;
  }

  try {
    const result = await createMoogoldOrder({
      userId,
      zoneId,
      moogoldProductId,
      partnerOrderId: session.id,
    });

    if (!result.ok) {
      console.error(
        "[webhook] MooGold fulfillment failed:",
        result.error,
        result.raw
      );
      if (authUserId) await markOrderStatus(session.id, "failed");
      await Promise.all([
        sendDiscordAudit({
          content: buildAdminPing(),
          embeds: [
            buildFailureEmbed({
              userId,
              zoneId,
              productName: product.name,
              productId,
              sessionId: session.id,
              error: result.error,
              moogoldRaw: result.raw.slice(0, 800),
            }),
          ],
        }),
        notifyBotLogger({
          event: "payment.failed",
          userId,
          zoneId,
          productId,
          sessionId: session.id,
          error: result.error,
        }),
      ]);
      return;
    }

    if (authUserId) await markOrderStatus(session.id, "fulfilled");

    const moogoldOrderRef = extractOrderRef(result.body);

    await Promise.all([
      sendDiscordAudit({
        embeds: [
          buildSuccessEmbed({
            userId,
            zoneId,
            productName: product.name,
            productId,
            sessionId: session.id,
            moogoldOrderRef,
          }),
        ],
      }),
      notifyBotLogger({
        event: "payment.success",
        userId,
        zoneId,
        productId,
        sessionId: session.id,
        message: moogoldOrderRef
          ? `MooGold order ${moogoldOrderRef}`
          : undefined,
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhook] MooGold exception:", message);
    if (authUserId) await markOrderStatus(session.id, "failed");

    await Promise.all([
      sendDiscordAudit({
        content: buildAdminPing(),
        embeds: [
          buildFailureEmbed({
            userId,
            zoneId,
            productName: product.name,
            productId,
            sessionId: session.id,
            error: message,
          }),
        ],
      }),
      notifyBotLogger({
        event: "payment.failed",
        userId,
        zoneId,
        productId,
        sessionId: session.id,
        error: message,
      }),
    ]);
  }
}

function extractOrderRef(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  for (const key of ["order_id", "orderId", "id", "account_order_id"]) {
    const val = record[key];
    if (typeof val === "string" || typeof val === "number") return String(val);
  }
  return undefined;
}
