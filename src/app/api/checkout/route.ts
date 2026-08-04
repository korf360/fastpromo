import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateMaxCashbackRedeem } from "@/lib/cashback-config";
import { isProductId, PRODUCT_CATALOG, type ProductId } from "@/lib/products";
import { validatePromoForCheckout } from "@/lib/promo";

const ID_PATTERN = /^[0-9]{1,20}$/;
const PRODUCT_ID_PATTERN = /^[a-z0-9_]{1,64}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizePlayerId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function sanitizeProductId(value: unknown): ProductId | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!PRODUCT_ID_PATTERN.test(trimmed)) return null;
  if (!isProductId(trimmed)) return null;
  return trimmed;
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return null;
  }
  return new Stripe(key.trim(), {
    apiVersion: "2026-07-29.dahlia",
  });
}

function resolveOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\/[a-zA-Z0-9.-]+(?::\d+)?$/.test(origin)) {
    return origin;
  }

  const host = request.headers.get("host");
  if (host && /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(host)) {
    const proto =
      request.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Sign in required to checkout.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    if (!isPlainObject(raw)) {
      return NextResponse.json(
        { ok: false, error: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const mlbbUserId = sanitizePlayerId(raw.userId);
    const zoneId = sanitizePlayerId(raw.zoneId);
    const productId = sanitizeProductId(raw.productId);
    const useCashback = raw.useCashback === true;
    const promoRaw =
      typeof raw.promoCode === "string" && raw.promoCode.trim().length > 0
        ? raw.promoCode
        : null;

    if (
      raw.consentAge !== true ||
      raw.consentDigitalDelivery !== true ||
      raw.consentIdsAccurate !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Required consents missing: age, immediate digital delivery / withdrawal waiver, and ID accuracy.",
          code: "CONSENTS_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (!mlbbUserId || !zoneId || !productId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid or missing userId, zoneId, or productId. IDs must be numeric; productId must be a known catalog key.",
        },
        { status: 400 }
      );
    }

    const product = PRODUCT_CATALOG[productId];
    const stripe = getStripe();

    if (!stripe) {
      console.error("[checkout] STRIPE_SECRET_KEY is missing or empty.");
      return NextResponse.json(
        { ok: false, error: "Payment service is temporarily unavailable." },
        { status: 500 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { cashbackCents: true, email: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "Account not found. Please sign in again." },
        { status: 401 }
      );
    }

    let promoCodeId: string | null = null;
    let promoCodeSnapshot: string | null = null;
    let promoDiscountCents = 0;

    if (promoRaw) {
      const promo = await validatePromoForCheckout(
        promoRaw,
        session.user.id,
        product.priceInCents,
        productId
      );
      if (!promo.ok) {
        return NextResponse.json(
          { ok: false, error: promo.error, code: promo.code ?? "PROMO_INVALID" },
          { status: 400 }
        );
      }
      promoCodeId = promo.promoCodeId;
      promoCodeSnapshot = promo.code;
      promoDiscountCents = promo.discountCents;
    }

    const priceAfterPromo = product.priceInCents - promoDiscountCents;
    const cashbackAppliedCents = useCashback
      ? calculateMaxCashbackRedeem(priceAfterPromo, dbUser.cashbackCents)
      : 0;
    const chargeCents = priceAfterPromo - cashbackAppliedCents;

    const origin = resolveOrigin(request);

    const discountBits: string[] = [];
    if (promoDiscountCents > 0 && promoCodeSnapshot) {
      discountBits.push(`promo ${promoCodeSnapshot}`);
    }
    if (cashbackAppliedCents > 0) {
      discountBits.push("cashback applied");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: dbUser.email,
      // Enable PayPal in Stripe Dashboard → Payment methods if checkout errors.
      payment_method_types: ["card", "paypal", "ideal", "bancontact", "klarna"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: chargeCents,
            product_data: {
              name: product.name,
              description:
                discountBits.length > 0
                  ? `FastPromo diamond top-up — ${product.name} (${discountBits.join(", ")})`
                  : `FastPromo diamond top-up — ${product.name}`,
              metadata: { productId },
            },
          },
        },
      ],
      metadata: {
        userId: mlbbUserId,
        zoneId,
        productId,
        authUserId: session.user.id,
        cashbackAppliedCents: String(cashbackAppliedCents),
        catalogPriceCents: String(product.priceInCents),
        promoCodeId: promoCodeId ?? "",
        promoCode: promoCodeSnapshot ?? "",
        promoDiscountCents: String(promoDiscountCents),
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#top-up`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { ok: false, error: "Unable to start checkout. Please try again." },
        { status: 500 }
      );
    }

    await prisma.order.create({
      data: {
        userId: session.user.id,
        stripeSessionId: checkoutSession.id,
        productId,
        productLabel: product.name,
        mlbbUserId,
        mlbbZoneId: zoneId,
        amountCents: chargeCents,
        cashbackAppliedCents,
        promoCodeId,
        promoCodeSnapshot,
        promoDiscountCents,
        status: "pending",
      },
    });

    void import("@/lib/notifyBot").then(({ notifyBotLogger }) =>
      notifyBotLogger({
        event: "payment.initiated",
        userId: mlbbUserId,
        zoneId,
        productId,
        sessionId: checkoutSession.id,
      })
    );

    return NextResponse.json({
      ok: true,
      sessionId: checkoutSession.id,
      redirectUrl: checkoutSession.url,
      cashbackAppliedCents,
      promoDiscountCents,
      chargeCents,
    });
  } catch (err) {
    console.error("[checkout] Stripe session creation failed:", err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
    return NextResponse.json(
      { ok: false, error: "Unable to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
