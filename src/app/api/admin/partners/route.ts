import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  platform: z.string().trim().max(40).optional().nullable(),
  handle: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().cuid(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { promoCodes: true } },
      promoCodes: {
        select: {
          id: true,
          useCount: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    partners: partners.map((p) => ({
      id: p.id,
      name: p.name,
      platform: p.platform,
      handle: p.handle,
      notes: p.notes,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      promoCodeCount: p._count.promoCodes,
      totalRedemptions: p.promoCodes.reduce((sum, c) => sum + c.useCount, 0),
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
      { ok: false, error: "Invalid partner data.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const partner = await prisma.partner.create({
    data: {
      name: parsed.data.name,
      platform: parsed.data.platform || null,
      handle: parsed.data.handle || null,
      notes: parsed.data.notes || null,
      active: parsed.data.active ?? true,
    },
  });

  return NextResponse.json({ ok: true, partner }, { status: 201 });
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
      { ok: false, error: "Invalid partner update.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...data } = parsed.data;

  try {
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.platform !== undefined ? { platform: data.platform || null } : {}),
        ...(data.handle !== undefined ? { handle: data.handle || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return NextResponse.json({ ok: true, partner });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Partner not found." },
      { status: 404 }
    );
  }
}
