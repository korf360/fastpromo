/**
 * Shared FastPromo product catalog.
 * Checkout prices are authoritative here; MooGold SKUs must match your partner catalog.
 */
export const PRODUCT_CATALOG = {
  mlbb_50_diamonds: {
    priceInCents: 99,
    name: "50 Diamonds",
    /** Override via MOOGOLD_SKU_MLBB_50_DIAMONDS */
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_50_DIAMONDS",
  },
  mlbb_250_diamonds: {
    priceInCents: 449,
    name: "250 Diamonds",
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_250_DIAMONDS",
  },
  mlbb_500_diamonds: {
    priceInCents: 899,
    name: "500 Diamonds",
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_500_DIAMONDS",
  },
  mlbb_weekly_pass: {
    priceInCents: 249,
    name: "Weekly Diamond Pass",
    moogoldEnvKey: "MOOGOLD_SKU_MLBB_WEEKLY_PASS",
  },
} as const;

export type ProductId = keyof typeof PRODUCT_CATALOG;

export function isProductId(value: string): value is ProductId {
  return value in PRODUCT_CATALOG;
}

export function resolveMoogoldProductId(productId: ProductId): string | null {
  const entry = PRODUCT_CATALOG[productId];
  const sku = process.env[entry.moogoldEnvKey]?.trim();
  return sku && sku.length > 0 ? sku : null;
}
