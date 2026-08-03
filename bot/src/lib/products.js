/** Mirror of web PRODUCT_CATALOG — prices in cents (never trust client). */
export const PRODUCT_CATALOG = {
  mlbb_50_diamonds: { priceInCents: 99, name: "50 Diamonds" },
  mlbb_250_diamonds: { priceInCents: 449, name: "250 Diamonds" },
  mlbb_500_diamonds: { priceInCents: 899, name: "500 Diamonds" },
  mlbb_weekly_pass: { priceInCents: 249, name: "Weekly Diamond Pass" },
};

/**
 * @param {string} id
 * @returns {id is keyof typeof PRODUCT_CATALOG}
 */
export function isProductId(id) {
  return Object.prototype.hasOwnProperty.call(PRODUCT_CATALOG, id);
}

export function formatEuroFromCents(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
