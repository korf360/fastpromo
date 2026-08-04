import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isProductId, PRODUCT_CATALOG } from "@/lib/products";
import { validatePromoForCheckout } from "@/lib/promo";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Sign in required.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const record = body as Record<string, unknown>;
  const promoCode = typeof record.promoCode === "string" ? record.promoCode : "";
  const productId =
    typeof record.productId === "string" ? record.productId.trim() : "";

  if (!isProductId(productId)) {
    return NextResponse.json(
      { ok: false, error: "Unknown product." },
      { status: 400 }
    );
  }

  const product = PRODUCT_CATALOG[productId];
  const result = await validatePromoForCheckout(
    promoCode,
    session.user.id,
    product.priceInCents,
    productId
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, code: result.code },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    partnerName: result.partnerName,
    discountPercent: result.discountPercent,
    discountCents: result.discountCents,
    priceAfterPromoCents: product.priceInCents - result.discountCents,
  });
}
