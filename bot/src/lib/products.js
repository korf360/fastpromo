/** Mirror of web PRODUCT_CATALOG — prices in cents (never trust client). */
export const PRODUCT_CATALOG = {
  mlbb_56_diamonds: { priceInCents: 99, name: "56 Diamonds" },
  mlbb_86_diamonds: { priceInCents: 149, name: "86 Diamonds" },
  mlbb_172_diamonds: { priceInCents: 279, name: "172 Diamonds" },
  mlbb_280_diamonds: { priceInCents: 419, name: "280 Diamonds" },
  mlbb_706_diamonds: { priceInCents: 1049, name: "706 Diamonds" },
  mlbb_1163_diamonds: { priceInCents: 1599, name: "1163 Diamonds" },
  mlbb_1446_diamonds: { priceInCents: 2399, name: "1446 Diamonds" },
  mlbb_2398_diamonds: { priceInCents: 3699, name: "2398 Diamonds" },
  mlbb_3688_diamonds: { priceInCents: 5299, name: "3688 Diamonds" },
  mlbb_6042_diamonds: { priceInCents: 7499, name: "6042 Diamonds" },
  mlbb_weekly_pass: { priceInCents: 189, name: "Weekly Diamond Pass" },
  mlbb_twilight_pass: { priceInCents: 849, name: "Twilight Pass" },
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
