/** Earn rate on net amount paid (default 2%). */
export function getCashbackPercent(): number {
  const raw = Number(
    process.env.NEXT_PUBLIC_CASHBACK_PERCENT ??
      process.env.CASHBACK_PERCENT ??
      "2"
  );
  if (!Number.isFinite(raw) || raw < 0 || raw > 20) return 2;
  return raw;
}

/**
 * Max share of an order (after promo) that wallet cashback may cover.
 * Default 30% — same model as common marketplace wallets (e.g. Eneba).
 */
export function getCashbackWalletCoverPercent(): number {
  const raw = Number(
    process.env.NEXT_PUBLIC_CASHBACK_WALLET_COVER_PERCENT ??
      process.env.CASHBACK_WALLET_COVER_PERCENT ??
      "30"
  );
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) return 30;
  return Math.floor(raw);
}

/** Minimum amount that must still go through Stripe (€0.50). */
export const STRIPE_MIN_CHARGE_CENTS = 50;

/** Earn cashback on net amount paid (cents). */
export function calculateCashbackEarned(amountPaidCents: number): number {
  if (amountPaidCents <= 0) return 0;
  return Math.floor((amountPaidCents * getCashbackPercent()) / 100);
}

/**
 * How much wallet credit can be applied to an order.
 * Caps at: balance, cover% of price-after-promo, and leaving Stripe min charge.
 */
export function calculateMaxCashbackRedeem(
  priceAfterPromoCents: number,
  walletBalanceCents: number
): number {
  if (priceAfterPromoCents <= 0 || walletBalanceCents <= 0) return 0;
  const coverPct = getCashbackWalletCoverPercent();
  const maxFromPercent = Math.floor((priceAfterPromoCents * coverPct) / 100);
  const maxLeavingStripe = Math.max(
    0,
    priceAfterPromoCents - STRIPE_MIN_CHARGE_CENTS
  );
  return Math.min(walletBalanceCents, maxFromPercent, maxLeavingStripe);
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
