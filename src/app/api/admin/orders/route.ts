import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const takeRaw = Number(searchParams.get("limit") || "100");
  const take = Math.min(200, Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 100));
  const promoOnly = searchParams.get("promo") === "1";
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: take * 2,
    include: {
      user: { select: { email: true, name: true } },
      promoCode: {
        select: {
          code: true,
          partner: { select: { name: true } },
        },
      },
    },
  });

  const filtered = orders
    .filter((o) => {
      if (promoOnly && !o.promoCodeSnapshot && o.promoDiscountCents <= 0) {
        return false;
      }
      if (!q) return true;
      const hay = [
        o.user.email,
        o.user.name ?? "",
        o.productLabel,
        o.mlbbUserId,
        o.mlbbZoneId,
        o.promoCodeSnapshot ?? "",
        o.status,
        o.stripeSessionId,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .slice(0, take);

  return NextResponse.json({
    ok: true,
    orders: filtered.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      status: o.status,
      productLabel: o.productLabel,
      productId: o.productId,
      mlbbUserId: o.mlbbUserId,
      mlbbZoneId: o.mlbbZoneId,
      amountCents: o.amountCents,
      cashbackAppliedCents: o.cashbackAppliedCents,
      cashbackEarnedCents: o.cashbackEarnedCents,
      promoUsed: Boolean(o.promoCodeSnapshot) || o.promoDiscountCents > 0,
      promoCode: o.promoCodeSnapshot,
      promoDiscountCents: o.promoDiscountCents,
      partnerName: o.promoCode?.partner.name ?? null,
      userEmail: o.user.email,
      userName: o.user.name,
      stripeSessionId: o.stripeSessionId,
    })),
  });
}
