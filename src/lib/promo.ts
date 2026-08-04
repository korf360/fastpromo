import { prisma } from "@/lib/prisma";
import {
  isProductId,
  isPromoEligibleProduct,
  type ProductId,
} from "@/lib/products";

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

/** Fixed creator / partner promo discount. */
export const CREATOR_PROMO_DISCOUNT_PERCENT = 5;

export function normalizePromoCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) return null;
  return code;
}

export function calculatePromoDiscountCents(catalogPriceCents: number): number {
  if (catalogPriceCents <= 0) return 0;
  return Math.floor((catalogPriceCents * CREATOR_PROMO_DISCOUNT_PERCENT) / 100);
}

export type PromoValidationResult =
  | {
      ok: true;
      promoCodeId: string;
      code: string;
      partnerName: string;
      discountPercent: number;
      discountCents: number;
    }
  | {
      ok: false;
      error: string;
      code?: string;
    };

/**
 * Validates a partner promo for a signed-in user at a given catalog price.
 * First-time use is enforced per (user, code). Redemption is recorded on payment.
 * Entry / thin-margin packages reject promos via promoEligible.
 */
export async function validatePromoForCheckout(
  rawCode: string,
  userId: string,
  catalogPriceCents: number,
  productId?: string
): Promise<PromoValidationResult> {
  if (productId) {
    if (!isProductId(productId)) {
      return {
        ok: false,
        error: "Unknown product.",
        code: "UNKNOWN_PRODUCT",
      };
    }
    if (!isPromoEligibleProduct(productId as ProductId)) {
      return {
        ok: false,
        error:
          "Creator promos are not available on this package. Choose a larger pack to apply your code.",
        code: "PROMO_PACK_INELIGIBLE",
      };
    }
  }

  const code = normalizePromoCode(rawCode);
  if (!code) {
    return {
      ok: false,
      error: "Invalid promo code format.",
      code: "INVALID_FORMAT",
    };
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code },
    include: { partner: true },
  });

  if (!promo || !promo.active || !promo.partner.active) {
    return {
      ok: false,
      error: "This promo code is not valid.",
      code: "NOT_FOUND",
    };
  }

  if (promo.maxUses != null && promo.useCount >= promo.maxUses) {
    return {
      ok: false,
      error: "This promo code has reached its usage limit.",
      code: "MAX_USES",
    };
  }

  const prior = await prisma.promoRedemption.findUnique({
    where: {
      promoCodeId_userId: {
        promoCodeId: promo.id,
        userId,
      },
    },
  });

  if (prior) {
    return {
      ok: false,
      error: "You already used this promo code. It only works once per account.",
      code: "ALREADY_USED",
    };
  }

  const discountCents = calculatePromoDiscountCents(catalogPriceCents);

  if (discountCents <= 0) {
    return {
      ok: false,
      error: "This promo code does not apply to the selected package.",
      code: "NO_DISCOUNT",
    };
  }

  // Keep at least €0.50 payable after promo (cashback may reduce further later).
  const maxDiscount = Math.max(0, catalogPriceCents - 50);
  const applied = Math.min(discountCents, maxDiscount);

  if (applied <= 0) {
    return {
      ok: false,
      error: "Promo cannot be applied to this package.",
      code: "MIN_CHARGE",
    };
  }

  return {
    ok: true,
    promoCodeId: promo.id,
    code: promo.code,
    partnerName: promo.partner.name,
    discountPercent: CREATOR_PROMO_DISCOUNT_PERCENT,
    discountCents: applied,
  };
}
