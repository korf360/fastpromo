import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

export const FINANCE_INCOME_CATEGORIES = ["payment", "refund", "adjustment"] as const;
export const FINANCE_EXPENSE_CATEGORIES = [
  "supplier",
  "stripe_fee",
  "ads",
  "tools",
  "tax",
  "other",
  "adjustment",
] as const;

export type FinanceIncomeCategory = (typeof FINANCE_INCOME_CATEGORIES)[number];
export type FinanceExpenseCategory = (typeof FINANCE_EXPENSE_CATEGORIES)[number];

/** Rough Stripe EU card fee estimate for bookkeeping (not an invoice). */
export function estimateStripeFeeCents(chargeCents: number): number {
  if (chargeCents <= 0) return 0;
  return Math.round(chargeCents * 0.015 + 25);
}

/**
 * Record customer payment as income (+ optional estimated Stripe fee expense).
 * Idempotent per Stripe session via unique (stripeSessionId, category, direction).
 */
export async function recordOrderPaymentInLedger(
  tx: Tx,
  input: {
    orderId: string;
    stripeSessionId: string;
    productLabel: string;
    amountPaidCents: number;
    occurredAt?: Date;
  }
) {
  if (input.amountPaidCents <= 0) return;

  await tx.financeEntry.upsert({
    where: {
      stripeSessionId_category_direction: {
        stripeSessionId: input.stripeSessionId,
        category: "payment",
        direction: "income",
      },
    },
    create: {
      direction: "income",
      category: "payment",
      amountCents: input.amountPaidCents,
      description: `Stripe payment — ${input.productLabel}`,
      note: "Auto-logged from successful checkout (pilot bookkeeping).",
      orderId: input.orderId,
      stripeSessionId: input.stripeSessionId,
      source: "system",
      occurredAt: input.occurredAt ?? new Date(),
    },
    update: {
      amountCents: input.amountPaidCents,
      description: `Stripe payment — ${input.productLabel}`,
      orderId: input.orderId,
    },
  });

  const fee = estimateStripeFeeCents(input.amountPaidCents);
  if (fee > 0) {
    await tx.financeEntry.upsert({
      where: {
        stripeSessionId_category_direction: {
          stripeSessionId: input.stripeSessionId,
          category: "stripe_fee",
          direction: "expense",
        },
      },
      create: {
        direction: "expense",
        category: "stripe_fee",
        amountCents: fee,
        description: `Estimated Stripe fee — ${input.productLabel}`,
        note: "Estimate ~1.5% + €0.25. Replace with exact fee from Stripe payout reports when available.",
        orderId: input.orderId,
        stripeSessionId: input.stripeSessionId,
        source: "system",
        occurredAt: input.occurredAt ?? new Date(),
      },
      update: {
        amountCents: fee,
        orderId: input.orderId,
      },
    });
  }
}

export function isFinanceExpenseCategory(
  value: string
): value is FinanceExpenseCategory {
  return (FINANCE_EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function isFinanceIncomeCategory(
  value: string
): value is FinanceIncomeCategory {
  return (FINANCE_INCOME_CATEGORIES as readonly string[]).includes(value);
}
