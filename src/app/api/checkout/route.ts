import Stripe from "stripe";
import { NextResponse } from "next/server";
import { isProductId, PRODUCT_CATALOG, type ProductId } from "@/lib/products";

/** Digits-only MLBB identifiers (injection-safe). */
const ID_PATTERN = /^[0-9]{1,20}$/;

/** Strict productId allowlist pattern. */
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

    const userId = sanitizePlayerId(raw.userId);
    const zoneId = sanitizePlayerId(raw.zoneId);
    const productId = sanitizeProductId(raw.productId);

    if (!userId || !zoneId || !productId) {
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
      console.error(
        "[checkout] STRIPE_SECRET_KEY is missing or empty. Cannot create session."
      );
      return NextResponse.json(
        { ok: false, error: "Payment service is temporarily unavailable." },
        { status: 500 }
      );
    }

    const origin = resolveOrigin(request);

    /**
     * `card` enables cards + Apple Pay / Google Pay (wallets) when configured
     * in the Stripe Dashboard. EU locals: iDEAL, Bancontact. Klarna covers the
     * Sofort migration path. Bizum requires an ES-capable Stripe account —
     * enable it in the Dashboard (or via automatic_payment_methods) if eligible.
     */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "ideal", "bancontact", "klarna"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: product.priceInCents,
            product_data: {
              name: product.name,
              description: `FastPromo MLBB top-up — ${product.name}`,
              metadata: {
                productId,
              },
            },
          },
        },
      ],
      metadata: {
        userId,
        zoneId,
        productId,
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    if (!session.url) {
      console.error("[checkout] Stripe session created without a URL", {
        sessionId: session.id,
      });
      return NextResponse.json(
        { ok: false, error: "Unable to start checkout. Please try again." },
        { status: 500 }
      );
    }

    // Fire-and-forget bot logger (does not block checkout)
    void import("@/lib/notifyBot").then(({ notifyBotLogger }) =>
      notifyBotLogger({
        event: "payment.initiated",
        userId,
        zoneId,
        productId,
        sessionId: session.id,
      })
    );

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      redirectUrl: session.url,
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
