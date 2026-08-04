import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const [
    orderCount,
    paidOrders,
    partnerCount,
    activeCodes,
    promoOrders,
    recentPromoUses,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ["paid", "fulfilled"] } },
    }),
    prisma.partner.count({ where: { active: true } }),
    prisma.promoCode.count({ where: { active: true } }),
    prisma.order.count({
      where: {
        OR: [
          { promoCodeSnapshot: { not: null } },
          { promoDiscountCents: { gt: 0 } },
        ],
      },
    }),
    prisma.promoRedemption.count(),
  ]);

  const revenue = await prisma.order.aggregate({
    where: { status: { in: ["paid", "fulfilled"] } },
    _sum: { amountCents: true, promoDiscountCents: true },
  });

  return NextResponse.json({
    ok: true,
    stats: {
      orderCount,
      paidOrders,
      partnerCount,
      activeCodes,
      promoOrders,
      recentPromoUses,
      revenueCents: revenue._sum.amountCents ?? 0,
      promoDiscountTotalCents: revenue._sum.promoDiscountCents ?? 0,
    },
  });
}
