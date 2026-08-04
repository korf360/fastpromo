import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import {
  FINANCE_EXPENSE_CATEGORIES,
  FINANCE_INCOME_CATEGORIES,
  isFinanceExpenseCategory,
  isFinanceIncomeCategory,
  recordOrderPaymentInLedger,
} from "@/lib/finance";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction");
  const limit = Math.min(
    500,
    Math.max(1, Number(searchParams.get("limit") || "150") || 150)
  );

  const where =
    direction === "income" || direction === "expense"
      ? { direction }
      : undefined;

  const [entries, incomeAgg, expenseAgg] = await Promise.all([
    prisma.financeEntry.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            productLabel: true,
            status: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    prisma.financeEntry.aggregate({
      where: { direction: "income" },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.financeEntry.aggregate({
      where: { direction: "expense" },
      _sum: { amountCents: true },
      _count: true,
    }),
  ]);

  const incomeCents = incomeAgg._sum.amountCents ?? 0;
  const expenseCents = expenseAgg._sum.amountCents ?? 0;

  return NextResponse.json({
    ok: true,
    summary: {
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      incomeCount: incomeAgg._count,
      expenseCount: expenseAgg._count,
    },
    categories: {
      income: FINANCE_INCOME_CATEGORIES,
      expense: FINANCE_EXPENSE_CATEGORIES,
    },
    entries: entries.map((e) => ({
      id: e.id,
      direction: e.direction,
      category: e.category,
      amountCents: e.amountCents,
      currency: e.currency,
      occurredAt: e.occurredAt.toISOString(),
      description: e.description,
      note: e.note,
      orderId: e.orderId,
      stripeSessionId: e.stripeSessionId,
      externalRef: e.externalRef,
      source: e.source,
      createdByEmail: e.createdByEmail,
      productLabel: e.order?.productLabel ?? null,
      orderStatus: e.order?.status ?? null,
      customerEmail: e.order?.user?.email ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;

  // Backfill system income from existing paid orders
  if (body.action === "backfill_payments") {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["paid", "fulfilled"] } },
      select: {
        id: true,
        stripeSessionId: true,
        productLabel: true,
        amountCents: true,
        createdAt: true,
      },
    });

    let created = 0;
    for (const order of orders) {
      await prisma.$transaction(async (tx) => {
        const before = await tx.financeEntry.count({
          where: {
            stripeSessionId: order.stripeSessionId,
            category: "payment",
            direction: "income",
          },
        });
        await recordOrderPaymentInLedger(tx, {
          orderId: order.id,
          stripeSessionId: order.stripeSessionId,
          productLabel: order.productLabel,
          amountPaidCents: order.amountCents,
          occurredAt: order.createdAt,
        });
        const after = await tx.financeEntry.count({
          where: {
            stripeSessionId: order.stripeSessionId,
            category: "payment",
            direction: "income",
          },
        });
        if (before === 0 && after > 0) created += 1;
      });
    }

    return NextResponse.json({ ok: true, backfilledOrders: created, scanned: orders.length });
  }

  const direction = typeof body.direction === "string" ? body.direction : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const note =
    typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
  const externalRef =
    typeof body.externalRef === "string" && body.externalRef.trim()
      ? body.externalRef.trim()
      : null;
  const amountEuros = Number(body.amountEuros);
  const amountCentsRaw = Number(body.amountCents);
  const amountCents = Number.isFinite(amountCentsRaw)
    ? Math.round(amountCentsRaw)
    : Number.isFinite(amountEuros)
      ? Math.round(amountEuros * 100)
      : NaN;

  if (!description || description.length > 240) {
    return NextResponse.json(
      { ok: false, error: "Description required (max 240 chars)." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > 50_000_000) {
    return NextResponse.json(
      { ok: false, error: "Amount must be a positive EUR value." },
      { status: 400 }
    );
  }

  if (direction === "expense" && !isFinanceExpenseCategory(category)) {
    return NextResponse.json(
      { ok: false, error: "Invalid expense category." },
      { status: 400 }
    );
  }
  if (direction === "income" && !isFinanceIncomeCategory(category)) {
    return NextResponse.json(
      { ok: false, error: "Invalid income category." },
      { status: 400 }
    );
  }
  if (direction !== "expense" && direction !== "income") {
    return NextResponse.json(
      { ok: false, error: "direction must be income or expense." },
      { status: 400 }
    );
  }

  let occurredAt = new Date();
  if (typeof body.occurredAt === "string" && body.occurredAt.trim()) {
    const parsed = new Date(body.occurredAt);
    if (!Number.isNaN(parsed.getTime())) occurredAt = parsed;
  }

  const entry = await prisma.financeEntry.create({
    data: {
      direction,
      category,
      amountCents,
      description,
      note,
      externalRef,
      source: "manual",
      createdByEmail: session.user.email,
      occurredAt,
    },
  });

  return NextResponse.json({ ok: true, entry }, { status: 201 });
}

export async function DELETE(request: Request) {
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

  const id =
    raw && typeof raw === "object" && !Array.isArray(raw) && typeof (raw as { id?: unknown }).id === "string"
      ? (raw as { id: string }).id
      : null;

  if (!id) {
    return NextResponse.json({ ok: false, error: "id required." }, { status: 400 });
  }

  const existing = await prisma.financeEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  if (existing.source === "system") {
    return NextResponse.json(
      {
        ok: false,
        error: "System entries (auto payments / fee estimates) cannot be deleted. Add an adjustment instead.",
      },
      { status: 400 }
    );
  }

  await prisma.financeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
