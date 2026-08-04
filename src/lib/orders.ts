import { prisma } from "@/lib/prisma";
import { calculateCashbackEarned } from "@/lib/cashback";
import { recordOrderPaymentInLedger } from "@/lib/finance";
import { buildReceiptNumber } from "@/lib/receipt";

type RecordOrderInput = {
  authUserId: string;
  stripeSessionId: string;
  productId: string;
  productLabel: string;
  mlbbUserId: string;
  mlbbZoneId: string;
  amountPaidCents: number;
  cashbackAppliedCents: number;
  promoCodeId?: string | null;
  promoCodeSnapshot?: string | null;
  promoDiscountCents?: number;
  status: "paid" | "fulfilled" | "failed";
};

/**
 * Upsert order. Wallet (redeem + earn) settles once when payment is confirmed.
 * Partner promo redemption is recorded once on first settlement.
 * Finance ledger income (+ estimated Stripe fee) is logged once on settlement.
 */
export async function recordOrderAndCashback(input: RecordOrderInput) {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
  });

  const alreadySettled =
    existing &&
    (existing.status === "paid" ||
      existing.status === "fulfilled" ||
      existing.status === "failed");

  const earned = calculateCashbackEarned(input.amountPaidCents);
  const promoCodeId = input.promoCodeId ?? existing?.promoCodeId ?? null;
  const promoCodeSnapshot =
    input.promoCodeSnapshot ?? existing?.promoCodeSnapshot ?? null;
  const promoDiscountCents =
    input.promoDiscountCents ?? existing?.promoDiscountCents ?? 0;

  return prisma.$transaction(async (tx) => {
    const orderRow = existing
      ? await tx.order.update({
          where: { id: existing.id },
          data: {
            status: input.status,
            amountCents: input.amountPaidCents,
            cashbackAppliedCents: input.cashbackAppliedCents,
            cashbackEarnedCents: alreadySettled
              ? existing.cashbackEarnedCents
              : earned,
            promoCodeId,
            promoCodeSnapshot,
            promoDiscountCents,
          },
        })
      : await tx.order.create({
          data: {
            userId: input.authUserId,
            stripeSessionId: input.stripeSessionId,
            productId: input.productId,
            productLabel: input.productLabel,
            mlbbUserId: input.mlbbUserId,
            mlbbZoneId: input.mlbbZoneId,
            amountCents: input.amountPaidCents,
            cashbackAppliedCents: input.cashbackAppliedCents,
            cashbackEarnedCents: earned,
            promoCodeId,
            promoCodeSnapshot,
            promoDiscountCents,
            status: input.status,
          },
        });

    // Always assign a shareable support ID (FP-YYYY-XXXXXXXX) for Discord /account.
    let order = orderRow;
    if (!order.receiptNumber) {
      const receiptNumber = buildReceiptNumber(order.id, order.createdAt);
      order = await tx.order.update({
        where: { id: order.id },
        data: { receiptNumber },
      });
    }

    if (!alreadySettled) {
      const user = await tx.user.findUnique({
        where: { id: input.authUserId },
      });
      if (!user) return order;

      let nextBalance = user.cashbackCents;

      if (input.cashbackAppliedCents > 0) {
        const redeem = Math.min(input.cashbackAppliedCents, nextBalance);
        nextBalance -= redeem;
        await tx.cashbackEntry.create({
          data: {
            userId: input.authUserId,
            orderId: orderRow.id,
            type: "redeem",
            amountCents: -redeem,
            note: `Redeemed on order ${input.stripeSessionId}`,
          },
        });
      }

      if (earned > 0) {
        nextBalance += earned;
        await tx.cashbackEntry.create({
          data: {
            userId: input.authUserId,
            orderId: orderRow.id,
            type: "earn",
            amountCents: earned,
            note: `Earned on ${input.productLabel}`,
          },
        });
      }

      await tx.user.update({
        where: { id: input.authUserId },
        data: { cashbackCents: nextBalance },
      });

      if (promoCodeId && promoDiscountCents > 0) {
        const alreadyRedeemed = await tx.promoRedemption.findUnique({
          where: {
            promoCodeId_userId: {
              promoCodeId,
              userId: input.authUserId,
            },
          },
        });

        if (!alreadyRedeemed) {
          await tx.promoRedemption.create({
            data: {
              promoCodeId,
              userId: input.authUserId,
              orderId: orderRow.id,
            },
          });
          await tx.promoCode.update({
            where: { id: promoCodeId },
            data: { useCount: { increment: 1 } },
          });
        }
      }

      if (input.status === "paid" || input.status === "fulfilled") {
        await recordOrderPaymentInLedger(tx, {
          orderId: orderRow.id,
          stripeSessionId: input.stripeSessionId,
          productLabel: input.productLabel,
          amountPaidCents: input.amountPaidCents,
        });
      }
    } else if (
      (input.status === "paid" || input.status === "fulfilled") &&
      input.amountPaidCents > 0
    ) {
      // Ensure ledger exists even if settlement happened before finance feature.
      await recordOrderPaymentInLedger(tx, {
        orderId: orderRow.id,
        stripeSessionId: input.stripeSessionId,
        productLabel: input.productLabel,
        amountPaidCents: input.amountPaidCents,
      });
    }

    return order;
  });
}

export async function markOrderStatus(
  stripeSessionId: string,
  status: "fulfilled" | "failed"
) {
  return prisma.order.updateMany({
    where: { stripeSessionId },
    data: { status },
  });
}
