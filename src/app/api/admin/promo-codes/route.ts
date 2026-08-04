import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import {
  CREATOR_PROMO_DISCOUNT_PERCENT,
  normalizePromoCode,
} from "@/lib/promo";

const createSchema = z.object({
  code: z.string().min(3).max(32),
  partnerId: z.string().cuid(),
  maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().cuid(),
  maxUses: z.number().int().min(1).max(1_000_000).nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      partner: { select: { id: true, name: true, active: true } },
      _count: { select: { redemptions: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    promoCodes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      partnerId: c.partnerId,
      partnerName: c.partner.name,
      partnerActive: c.partner.active,
      discountPercent: CREATOR_PROMO_DISCOUNT_PERCENT,
      active: c.active,
      maxUses: c.maxUses,
      useCount: c.useCount,
      redemptionCount: c._count.redemptions,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid promo code data.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const code = normalizePromoCode(parsed.data.code);
  if (!code) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Code must be 3–32 characters: letters, numbers, underscore or hyphen.",
      },
      { status: 400 }
    );
  }

  const partner = await prisma.partner.findUnique({
    where: { id: parsed.data.partnerId },
  });
  if (!partner) {
    return NextResponse.json(
      { ok: false, error: "Partner not found." },
      { status: 404 }
    );
  }

  try {
    const promo = await prisma.promoCode.create({
      data: {
        code,
        partnerId: parsed.data.partnerId,
        discountPercent: CREATOR_PROMO_DISCOUNT_PERCENT,
        maxUses: parsed.data.maxUses ?? null,
        active: parsed.data.active ?? true,
      },
      include: { partner: { select: { name: true } } },
    });

    return NextResponse.json({ ok: true, promoCode: promo }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "That promo code already exists." },
      { status: 409 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid promo update.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...data } = parsed.data;

  try {
    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return NextResponse.json({ ok: true, promoCode: promo });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Promo code not found." },
      { status: 404 }
    );
  }
}
