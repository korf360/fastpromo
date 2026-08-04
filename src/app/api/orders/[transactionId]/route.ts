import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRODUCT_CATALOG, isProductId } from "@/lib/products";
import { buildReceiptNumber } from "@/lib/receipt";
import { formatCents } from "@/lib/cashback-config";
import {
  adminGuidance,
  categoryLabel,
} from "@/lib/order-diagnostics";

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}

const RECEIPT_RE = /^FP-\d{4}-[A-Z0-9]{8}$/i;
const STRIPE_CS_RE = /^cs_[a-zA-Z0-9_]+$/;

function mapDbStatus(status: string): "Pending" | "Completed" | "Failed" | "Paid" {
  switch (status) {
    case "fulfilled":
      return "Completed";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return formatCents(cents);
  }
}

async function ensureReceipt(
  order: { id: string; createdAt: Date; receiptNumber: string | null }
): Promise<string> {
  if (order.receiptNumber) return order.receiptNumber;
  const receiptNumber = buildReceiptNumber(order.id, order.createdAt);
  try {
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptNumber },
    });
  } catch {
    // Unique race or concurrent backfill — display value is still valid.
  }
  return receiptNumber;
}

/**
 * Order lookup for Discord `/order` and support tooling.
 * Accepts support ID `FP-YYYY-XXXXXXXX` or Stripe Checkout Session `cs_...`.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { transactionId: rawId } = await context.params;
  const ref = decodeURIComponent(rawId ?? "").trim();

  if (!ref) {
    return NextResponse.json(
      { ok: false, error: "Missing order reference." },
      { status: 400 }
    );
  }

  const isReceipt = RECEIPT_RE.test(ref);
  const isStripe = STRIPE_CS_RE.test(ref);

  if (!isReceipt && !isStripe) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid reference. Use a support ID (FP-YYYY-XXXXXXXX) from the account page, or a Stripe session ID (cs_...).",
      },
      { status: 400 }
    );
  }

  try {
    let order =
      isReceipt
        ? await prisma.order.findFirst({
            where: { receiptNumber: { equals: ref.toUpperCase(), mode: "insensitive" } },
            include: { user: { select: { email: true } } },
          })
        : await prisma.order.findUnique({
            where: { stripeSessionId: ref },
            include: { user: { select: { email: true } } },
          });

    // Legacy orders: receiptNumber may not be stored yet — match by FP suffix.
    if (!order && isReceipt) {
      const suffix = ref.slice(-8).toUpperCase();
      const year = Number(ref.split("-")[1]);
      const candidates = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lt: new Date(Date.UTC(year + 1, 0, 1)),
          },
        },
        include: { user: { select: { email: true } } },
        take: 200,
        orderBy: { createdAt: "desc" },
      });
      order =
        candidates.find(
          (o) =>
            o.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() === suffix
        ) ?? null;
    }

    if (order) {
      const receiptNumber = await ensureReceipt(order);
      const paymentCaptured =
        order.status === "paid" ||
        order.status === "fulfilled" ||
        order.status === "failed";

      return NextResponse.json({
        ok: true,
        status: mapDbStatus(order.status),
        dbStatus: order.status,
        receiptNumber,
        sessionId: order.stripeSessionId,
        paymentStatus: paymentCaptured ? "paid" : null,
        sessionStatus: null,
        userId: order.mlbbUserId,
        zoneId: order.mlbbZoneId,
        productId: order.productId,
        productLabel: order.productLabel,
        amountTotal: order.amountCents,
        amountFormatted: money(order.amountCents, order.currency),
        currency: order.currency,
        customerEmail: order.user.email,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
        failedAt: order.failedAt?.toISOString() ?? null,
        cashbackAppliedCents: order.cashbackAppliedCents,
        cashbackEarnedCents: order.cashbackEarnedCents,
        promoCode: order.promoCodeSnapshot,
        promoDiscountCents: order.promoDiscountCents,
        moogoldOrderRef: order.moogoldOrderRef,
        failure: order.status === "failed"
          ? {
              category: order.failureCategory,
              categoryLabel: categoryLabel(order.failureCategory),
              reason:
                order.failureReason ||
                "Order marked failed, but no detailed reason was stored (older order).",
              detail: order.failureDetail,
              guidance: adminGuidance(order.failureCategory),
            }
          : null,
        timeline: {
          created: order.createdAt.toISOString(),
          paid: order.paidAt?.toISOString() ?? null,
          fulfilled: order.fulfilledAt?.toISOString() ?? null,
          failed: order.failedAt?.toISOString() ?? null,
        },
        source: "database",
      });
    }

    // Stripe-only fallback for cs_... not yet written to DB.
    if (!isStripe) {
      return NextResponse.json(
        { ok: false, error: "Order not found for that support ID." },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "Payment service unavailable." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(ref);
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
      dbStatus: null,
      receiptNumber: null,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      userId: meta.userId ?? null,
      zoneId: meta.zoneId ?? null,
      productId,
      productLabel,
      amountTotal: session.amount_total,
      amountFormatted:
        typeof session.amount_total === "number"
          ? money(session.amount_total, session.currency || "eur")
          : null,
      currency: session.currency,
      customerEmail: session.customer_details?.email ?? null,
      createdAt: null,
      source: "stripe",
    });
  } catch (err) {
    console.error("[orders] retrieve failed:", err);
    return NextResponse.json(
      { ok: false, error: "Order not found or could not be retrieved." },
      { status: 404 }
    );
  }
}
