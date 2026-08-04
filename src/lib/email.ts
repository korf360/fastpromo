import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  buildReceiptDocument,
  buildReceiptNumber,
  resolveCatalogPriceCents,
  type ReceiptOrderData,
} from "@/lib/receipt";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "FastPromo <onboarding@resend.dev>"
  );
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
}

async function loadReceiptOrder(
  orderId: string
): Promise<ReceiptOrderData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
    },
  });
  if (!order) return null;

  let receiptNumber = order.receiptNumber;
  if (!receiptNumber) {
    receiptNumber = buildReceiptNumber(order.id, order.createdAt);
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { receiptNumber },
      });
    } catch {
      const refreshed = await prisma.order.findUnique({
        where: { id: order.id },
        select: { receiptNumber: true },
      });
      receiptNumber = refreshed?.receiptNumber ?? receiptNumber;
    }
  }

  return {
    id: order.id,
    receiptNumber,
    createdAt: order.createdAt,
    status: order.status,
    productLabel: order.productLabel,
    productId: order.productId,
    mlbbUserId: order.mlbbUserId,
    mlbbZoneId: order.mlbbZoneId,
    catalogPriceCents: resolveCatalogPriceCents(order),
    promoDiscountCents: order.promoDiscountCents,
    promoCodeSnapshot: order.promoCodeSnapshot,
    cashbackAppliedCents: order.cashbackAppliedCents,
    cashbackEarnedCents: order.cashbackEarnedCents,
    amountCents: order.amountCents,
    currency: order.currency,
    stripeSessionId: order.stripeSessionId,
    customerEmail: order.user.email,
    customerName: order.user.name,
  };
}

/**
 * Ensures receipt number exists and emails the customer once (idempotent).
 */
export async function sendOrderReceiptEmail(orderId: string): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const order = await loadReceiptOrder(orderId);
  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { receiptEmailedAt: true, status: true },
  });

  if (
    existing?.status !== "paid" &&
    existing?.status !== "fulfilled" &&
    existing?.status !== "failed"
  ) {
    return { ok: false, skipped: true, error: "Order not settled yet." };
  }

  if (existing.receiptEmailedAt) {
    return { ok: true, skipped: true };
  }

  const resend = getResend();
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY missing — receipt email skipped for",
      order.receiptNumber
    );
    return { ok: false, skipped: true, error: "Email provider not configured." };
  }

  const origin = siteOrigin();
  const receiptUrl = origin ? `${origin}/account/receipt/${order.id}` : null;
  const doc = buildReceiptDocument(order, { receiptUrl });

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: order.customerEmail,
      subject: doc.subject,
      html: doc.htmlEmail,
      text: doc.textEmail,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { receiptEmailedAt: new Date() },
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed:", message);
    return { ok: false, error: message };
  }
}
