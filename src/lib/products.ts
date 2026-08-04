/**
 * FastPromo product catalog — checkout prices are authoritative.
 *
 * Market anchor (EU in-game reference provided for pricing):
 *   50→€0.86 · 150→€2.60 · 250→€4.33 · 500→€6.67
 *   1000→€17.36 · 1500→€26.04 · 2500→€43.40 · 5000→€86.82
 *
 * Strategy: map to real MooGold Global variations, undercut official on
 * €/diamond (and absolute price where cost allows). Cost basis = public
 * MooGold USD × 0.92 (conservative for new partners). Stripe ≈ 1.5% + €0.25.
 *
 * Entry packs may run at near-zero margin (traffic / conversion). Those are
 * marked promoEligible: false so creator codes cannot erase the remaining
 * margin. Value packs carry promo discounts.
 * Avoid First Top-Up Bonus SKUs (one-time per account).
 */
export const PRODUCT_CATALOG = {
  mlbb_56_diamonds: {
    priceInCents: 99,
    name: "56 Diamonds",
    diamonds: 56,
    promoEligible: false,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_56_DIAMONDS",
    /** MG 51+5 · ~$0.78 · vs official 50 @ €0.86 — entry tier, thin margin */
    moogoldVariationHint: "51 + 5 Diamonds",
  },
  mlbb_86_diamonds: {
    priceInCents: 149,
    name: "86 Diamonds",
    diamonds: 86,
    promoEligible: false,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_86_DIAMONDS",
    /** MG 78+8 · ~$1.27 */
    moogoldVariationHint: "78 Diamonds + 8 Bonus",
  },
  mlbb_172_diamonds: {
    priceInCents: 279,
    name: "172 Diamonds",
    diamonds: 172,
    promoEligible: false,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_172_DIAMONDS",
    /** MG 156+16 · beats official 150 @ €2.60 on diamonds + €/d */
    moogoldVariationHint: "156 Diamonds + 16 Bonus",
  },
  mlbb_280_diamonds: {
    priceInCents: 419,
    name: "280 Diamonds",
    diamonds: 280,
    promoEligible: false,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_280_DIAMONDS",
    /** MG 254+26 · beats official 250 @ €4.33 */
    moogoldVariationHint: "254 + 26 Diamonds",
  },
  mlbb_706_diamonds: {
    priceInCents: 1049,
    name: "706 Diamonds",
    diamonds: 706,
    badge: "Popular",
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_706_DIAMONDS",
    /** MG 625+81 · mid pack between official 500 and 1000 */
    moogoldVariationHint: "625 Diamonds + 81 Bonus",
  },
  mlbb_1163_diamonds: {
    priceInCents: 1599,
    name: "1163 Diamonds",
    diamonds: 1163,
    badge: "Best Value",
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_1163_DIAMONDS",
    /** MG 1007+156 · under official 1000 @ €17.36 with more diamonds */
    moogoldVariationHint: "1007 + 156 Diamonds",
  },
  mlbb_1446_diamonds: {
    priceInCents: 2399,
    name: "1446 Diamonds",
    diamonds: 1446,
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_1446_DIAMONDS",
    /** MG 1446 · under official 1500 @ €26.04 */
    moogoldVariationHint: "1446 Diamonds",
  },
  mlbb_2398_diamonds: {
    priceInCents: 3699,
    name: "2398 Diamonds",
    diamonds: 2398,
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_2398_DIAMONDS",
    /** MG 2015+383 · under official 2500 @ €43.40 */
    moogoldVariationHint: "2015 + 383 Diamonds",
  },
  mlbb_3688_diamonds: {
    priceInCents: 5299,
    name: "3688 Diamonds",
    diamonds: 3688,
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_3688_DIAMONDS",
    /** MG 3099+589 · ~$43.53 · high-volume margin pack */
    moogoldVariationHint: "3099 Diamonds + 589 Bonus",
  },
  mlbb_6042_diamonds: {
    priceInCents: 7499,
    name: "6042 Diamonds",
    diamonds: 6042,
    badge: "Max Value",
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_6042_DIAMONDS",
    /** MG 5035+1007 · under official 5000 @ €86.82 with more diamonds */
    moogoldVariationHint: "5035 + 1007 Diamonds",
  },
  mlbb_weekly_pass: {
    priceInCents: 189,
    name: "Weekly Diamond Pass",
    diamonds: null,
    promoEligible: false,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_WEEKLY_PASS",
    /** MG Weekly Pass · ~$1.54 */
    moogoldVariationHint: "Weekly Pass",
  },
  mlbb_twilight_pass: {
    priceInCents: 849,
    name: "Twilight Pass",
    diamonds: null,
    promoEligible: true,
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_TWILIGHT_PASS",
    /** MG Twilight Pass · ~$8.15 */
    moogoldVariationHint: "Twilight Pass",
  },
} as const;

export type ProductId = keyof typeof PRODUCT_CATALOG;

export type CatalogEntry = (typeof PRODUCT_CATALOG)[ProductId];

export function isProductId(value: string): value is ProductId {
  return value in PRODUCT_CATALOG;
}

export function isPromoEligibleProduct(productId: ProductId): boolean {
  return PRODUCT_CATALOG[productId].promoEligible;
}

export function resolveMoogoldProductId(productId: ProductId): string | null {
  const entry = PRODUCT_CATALOG[productId];
  const sku = process.env[entry.moogoldEnvKey]?.trim();
  return sku && sku.length > 0 ? sku : null;
}

/** UI packages derived from the server catalog (prices in euros). */
export function getStorePackages() {
  return (Object.keys(PRODUCT_CATALOG) as ProductId[]).map((id) => {
    const entry = PRODUCT_CATALOG[id];
    return {
      id,
      label: entry.name,
      diamonds: entry.diamonds,
      price: entry.priceInCents / 100,
      badge: "badge" in entry ? entry.badge : undefined,
      promoEligible: entry.promoEligible,
    };
  });
}
