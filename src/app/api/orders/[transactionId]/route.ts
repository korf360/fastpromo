import Stripe from "stripe";
import { NextResponse } from "next/server";
import { PRODUCT_CATALOG, isProductId } from "@/lib/products";

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}

/**
 * Real-time order status for Discord `/order` and internal tooling.
 * transactionId = Stripe Checkout Session ID (cs_...)
 */
export async function GET(_request: Request, context: RouteContext) {
  const { transactionId: rawId } = await context.params;
  const transactionId = rawId?.trim();

  if (!transactionId || !/^cs_[a-zA-Z0-9_]+$/.test(transactionId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid transaction_id." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "Payment service unavailable." },
      { status: 500 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(transactionId);
    const meta = session.metadata ?? {};
    const productId = meta.productId ?? null;

    let status: "Pending" | "Completed" | "Failed" = "Pending";
    if (session.status === "expired") {
      status = "Failed";
    } else if (
      session.status === "complete" &&
      session.payment_status === "paid"
    ) {
      status = "Completed";
    } else if (session.payment_status === "unpaid" && session.status === "open") {
      status = "Pending";
    } else if (session.payment_status === "no_payment_required") {
      status = "Completed";
    }

    const productLabel =
      productId && isProductId(productId)
        ? PRODUCT_CATALOG[productId].name
        : null;

    return NextResponse.json({
      ok: true,
      status,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      userId: meta.userId ?? null,
      zoneId: meta.zoneId ?? null,
      productId,
      productLabel,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("[orders] retrieve failed:", err);
    return NextResponse.json(
      { ok: false, error: "Order not found or could not be retrieved." },
      { status: 404 }
    );
  }
}
