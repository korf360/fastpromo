"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/cashback-config";

type Tab = "overview" | "finance" | "partners" | "codes" | "orders";

type Stats = {
  orderCount: number;
  paidOrders: number;
  partnerCount: number;
  activeCodes: number;
  promoOrders: number;
  recentPromoUses: number;
  revenueCents: number;
  promoDiscountTotalCents: number;
};

type FinanceSummary = {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  incomeCount: number;
  expenseCount: number;
};

type FinanceEntryRow = {
  id: string;
  direction: string;
  category: string;
  amountCents: number;
  currency: string;
  occurredAt: string;
  description: string;
  note: string | null;
  orderId: string | null;
  stripeSessionId: string | null;
  externalRef: string | null;
  source: string;
  createdByEmail: string | null;
  productLabel: string | null;
  orderStatus: string | null;
  customerEmail: string | null;
};

type Partner = {
  id: string;
  name: string;
  platform: string | null;
  handle: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  promoCodeCount: number;
  totalRedemptions: number;
};

type PromoCodeRow = {
  id: string;
  code: string;
  partnerId: string;
  partnerName: string;
  partnerActive: boolean;
  discountPercent: number;
  active: boolean;
  maxUses: number | null;
  useCount: number;
  redemptionCount: number;
  createdAt: string;
};

type OrderRow = {
  id: string;
  createdAt: string;
  status: string;
  productLabel: string;
  mlbbUserId: string;
  mlbbZoneId: string;
  amountCents: number;
  cashbackAppliedCents: number;
  promoUsed: boolean;
  promoCode: string | null;
  promoDiscountCents: number;
  partnerName: string | null;
  userEmail: string;
  userName: string | null;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "finance", label: "Finance log" },
  { id: "partners", label: "Partners" },
  { id: "codes", label: "Promo codes" },
  { id: "orders", label: "Purchases" },
];

const EXPENSE_CATEGORIES = [
  "supplier",
  "stripe_fee",
  "ads",
  "tools",
  "tax",
  "other",
  "adjustment",
] as const;

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderQuery, setOrderQuery] = useState("");
  const [promoOnly, setPromoOnly] = useState(false);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntryRow[]>([]);
  const [financeFilter, setFinanceFilter] = useState<"all" | "income" | "expense">("all");
  const [expenseForm, setExpenseForm] = useState({
    category: "supplier",
    amountEuros: "",
    description: "",
    note: "",
    externalRef: "",
    occurredAt: "",
  });
  const [pending, startTransition] = useTransition();

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    platform: "",
    handle: "",
    notes: "",
  });
  const [codeForm, setCodeForm] = useState({
    code: "",
    partnerId: "",
    maxUses: "",
  });

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load stats");
    setStats(data.stats);
  }, []);

  const loadPartners = useCallback(async () => {
    const res = await fetch("/api/admin/partners");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load partners");
    setPartners(data.partners);
    setCodeForm((prev) => ({
      ...prev,
      partnerId: prev.partnerId || data.partners[0]?.id || "",
    }));
  }, []);

  const loadCodes = useCallback(async () => {
    const res = await fetch("/api/admin/promo-codes");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load codes");
    setCodes(data.promoCodes);
  }, []);

  const loadOrders = useCallback(async (q: string, promo: boolean) => {
    const params = new URLSearchParams({ limit: "100" });
    if (q) params.set("q", q);
    if (promo) params.set("promo", "1");
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load orders");
    setOrders(data.orders);
  }, []);

  const loadFinance = useCallback(async (filter: "all" | "income" | "expense") => {
    const params = new URLSearchParams({ limit: "200" });
    if (filter !== "all") params.set("direction", filter);
    const res = await fetch(`/api/admin/finance?${params}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load finance log");
    setFinanceSummary(data.summary);
    setFinanceEntries(data.entries);
  }, []);

  const refresh = useCallback(
    (active: Tab) => {
      startTransition(async () => {
        setError(null);
        try {
          if (active === "overview") {
            await Promise.all([loadStats(), loadPartners(), loadCodes(), loadFinance("all")]);
          } else if (active === "finance") {
            await loadFinance(financeFilter);
          } else if (active === "partners") {
            await loadPartners();
          } else if (active === "codes") {
            await Promise.all([loadPartners(), loadCodes()]);
          } else {
            await loadOrders(orderQuery, promoOnly);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      });
    },
    [
      loadStats,
      loadPartners,
      loadCodes,
      loadOrders,
      loadFinance,
      orderQuery,
      promoOnly,
      financeFilter,
    ]
  );

  useEffect(() => {
    refresh(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on tab change only
  }, [tab]);

  async function createPartner(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: partnerForm.name,
        platform: partnerForm.platform || null,
        handle: partnerForm.handle || null,
        notes: partnerForm.notes || null,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not create partner");
      return;
    }
    setPartnerForm({ name: "", platform: "", handle: "", notes: "" });
    await loadPartners();
    await loadStats();
  }

  async function togglePartner(id: string, active: boolean) {
    setError(null);
    const res = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Update failed");
      return;
    }
    await loadPartners();
  }

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: codeForm.code,
        partnerId: codeForm.partnerId,
        maxUses: codeForm.maxUses ? Number(codeForm.maxUses) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not create promo code");
      return;
    }
    setCodeForm((prev) => ({ ...prev, code: "", maxUses: "" }));
    await loadCodes();
    await loadStats();
  }

  async function toggleCode(id: string, active: boolean) {
    setError(null);
    const res = await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Update failed");
      return;
    }
    await loadCodes();
  }

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction: "expense",
        category: expenseForm.category,
        amountEuros: Number(expenseForm.amountEuros),
        description: expenseForm.description,
        note: expenseForm.note || null,
        externalRef: expenseForm.externalRef || null,
        occurredAt: expenseForm.occurredAt || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not add expense");
      return;
    }
    setExpenseForm({
      category: "supplier",
      amountEuros: "",
      description: "",
      note: "",
      externalRef: "",
      occurredAt: "",
    });
    await loadFinance(financeFilter);
  }

  async function backfillPayments() {
    setError(null);
    const res = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "backfill_payments" }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Backfill failed");
      return;
    }
    await loadFinance(financeFilter);
  }

  async function deleteFinanceEntry(id: string) {
    setError(null);
    const res = await fetch("/api/admin/finance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Delete failed");
      return;
    }
    await loadFinance(financeFilter);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Partner console
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
            Partners, promo codes, purchases, and the finance log (payments +
            expenses) for pilot bookkeeping.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refresh(tab)}
            disabled={pending}
            className="rounded-lg border border-white/15 px-3.5 py-2 text-sm text-white/70 transition hover:border-white/30 disabled:opacity-50"
          >
            {pending ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/account"
            className="rounded-lg border border-white/15 px-3.5 py-2 text-sm text-white/70 transition hover:border-white/30"
          >
            Account
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-[#FFD700] px-3.5 py-2 text-sm font-bold text-[#0d0f12] transition hover:brightness-110"
          >
            Storefront
          </Link>
        </div>
      </div>

      <div
        className="mt-6 flex gap-1 overflow-x-auto border-b border-white/10"
        role="tablist"
        aria-label="Admin sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === t.id
                ? "border-[#FFD700] text-[#FFD700]"
                : "border-transparent text-white/45 hover:text-white/75"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8">
        {tab === "overview" && (
          <section aria-label="Overview">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Paid orders" value={String(stats?.paidOrders ?? "—")} />
              <Stat
                label="Revenue collected"
                value={stats ? formatCents(stats.revenueCents) : "—"}
                accent
              />
              <Stat label="Active partners" value={String(stats?.partnerCount ?? "—")} />
              <Stat label="Active codes" value={String(stats?.activeCodes ?? "—")} />
              <Stat label="Orders w/ promo" value={String(stats?.promoOrders ?? "—")} />
              <Stat label="Promo redemptions" value={String(stats?.recentPromoUses ?? "—")} />
              <Stat
                label="Promo discounts given"
                value={stats ? formatCents(stats.promoDiscountTotalCents) : "—"}
              />
              <Stat label="All orders" value={String(stats?.orderCount ?? "—")} />
            </div>
            <p className="mt-6 text-xs text-white/35">
              Access restricted to authorized admin emails. Promo codes work once per customer
              account and settle only after successful payment. Use the Finance log tab to
              track Stripe income and supplier/ad costs for later tax filing.
            </p>
            {financeSummary && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Ledger income"
                  value={formatCents(financeSummary.incomeCents)}
                  accent
                />
                <Stat
                  label="Ledger expenses"
                  value={formatCents(financeSummary.expenseCents)}
                />
                <Stat
                  label="Ledger net"
                  value={formatCents(financeSummary.netCents)}
                />
              </div>
            )}
          </section>
        )}

        {tab === "finance" && (
          <section className="space-y-8" aria-label="Finance log">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Total income"
                value={financeSummary ? formatCents(financeSummary.incomeCents) : "—"}
                accent
              />
              <Stat
                label="Total expenses"
                value={financeSummary ? formatCents(financeSummary.expenseCents) : "—"}
              />
              <Stat
                label="Net (income − expenses)"
                value={financeSummary ? formatCents(financeSummary.netCents) : "—"}
              />
              <Stat
                label="Entries"
                value={
                  financeSummary
                    ? String(financeSummary.incomeCount + financeSummary.expenseCount)
                    : "—"
                }
              />
            </div>

            <p className="text-sm text-white/45">
              Payments are auto-logged when Stripe confirms an order. Add MooGold /
              supplier costs, ads, and tools as expenses. This is an internal
              bookkeeping aid for your pilot — not a substitute for official
              accounting software or your gestor.
            </p>

            <div className="flex flex-wrap gap-2">
              {(["all", "income", "expense"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFinanceFilter(f);
                    void loadFinance(f);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition ${
                    financeFilter === f
                      ? "border-[#FFD700]/50 text-[#FFD700]"
                      : "border-white/15 text-white/55 hover:border-white/30"
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void backfillPayments()}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/55 transition hover:border-white/30"
              >
                Backfill past payments
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
              <form
                onSubmit={createExpense}
                className="h-fit space-y-3 border border-white/10 bg-white/[0.02] p-5"
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                  Add expense
                </h2>
                <label className="block text-xs text-white/45">
                  Category
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-white/45">
                  Amount (EUR)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseForm.amountEuros}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, amountEuros: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-white/45">
                  Description
                  <input
                    required
                    maxLength={240}
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="MooGold top-up / ads / Canva…"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-white/45">
                  External ref (optional)
                  <input
                    value={expenseForm.externalRef}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, externalRef: e.target.value }))
                    }
                    placeholder="Invoice # / MooGold order"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-white/45">
                  Date (optional)
                  <input
                    type="date"
                    value={expenseForm.occurredAt}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, occurredAt: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-white/45">
                  Note (optional)
                  <textarea
                    rows={2}
                    value={expenseForm.note}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, note: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#FFD700] px-4 py-2.5 text-sm font-bold text-[#0d0f12] transition hover:brightness-110"
                >
                  Save expense
                </button>
              </form>

              <div className="overflow-x-auto border border-white/10">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                    <tr>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Category</th>
                      <th className="px-3 py-3 font-medium">Description</th>
                      <th className="px-3 py-3 font-medium text-right">Amount</th>
                      <th className="px-3 py-3 font-medium">Source</th>
                      <th className="px-3 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {financeEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-white/45">
                          No ledger entries yet. Paid orders appear automatically;
                          add supplier costs here. Use “Backfill past payments” if
                          you already have orders.
                        </td>
                      </tr>
                    ) : (
                      financeEntries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-white/5 text-white/75"
                        >
                          <td className="px-3 py-3 whitespace-nowrap text-xs">
                            {new Date(entry.occurredAt).toLocaleString("en-GB")}
                          </td>
                          <td className="px-3 py-3 capitalize">
                            <span
                              className={
                                entry.direction === "income"
                                  ? "text-emerald-300"
                                  : "text-red-300"
                              }
                            >
                              {entry.direction}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs">
                            {entry.category}
                          </td>
                          <td className="px-3 py-3">
                            <p>{entry.description}</p>
                            {entry.customerEmail && (
                              <p className="mt-0.5 text-xs text-white/35">
                                {entry.customerEmail}
                              </p>
                            )}
                            {entry.externalRef && (
                              <p className="mt-0.5 font-mono text-xs text-white/35">
                                {entry.externalRef}
                              </p>
                            )}
                          </td>
                          <td
                            className={`px-3 py-3 text-right tabular-nums ${
                              entry.direction === "income"
                                ? "text-[#FFD700]"
                                : "text-red-300"
                            }`}
                          >
                            {entry.direction === "income" ? "+" : "−"}
                            {formatCents(entry.amountCents)}
                          </td>
                          <td className="px-3 py-3 text-xs text-white/40">
                            {entry.source}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {entry.source === "manual" ? (
                              <button
                                type="button"
                                onClick={() => void deleteFinanceEntry(entry.id)}
                                className="text-xs text-white/40 hover:text-red-300"
                              >
                                Delete
                              </button>
                            ) : (
                              <span className="text-xs text-white/25">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === "partners" && (
          <section className="grid gap-8 lg:grid-cols-[320px_1fr]" aria-label="Partners">
            <form
              onSubmit={createPartner}
              className="space-y-3 border border-white/10 bg-white/[0.02] p-5"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Add partner
              </h2>
              <Field
                label="Display name"
                value={partnerForm.name}
                onChange={(v) => setPartnerForm((p) => ({ ...p, name: v }))}
                required
                placeholder="Streamer name"
              />
              <Field
                label="Platform"
                value={partnerForm.platform}
                onChange={(v) => setPartnerForm((p) => ({ ...p, platform: v }))}
                placeholder="Twitch / YouTube / Kick"
              />
              <Field
                label="Handle"
                value={partnerForm.handle}
                onChange={(v) => setPartnerForm((p) => ({ ...p, handle: v }))}
                placeholder="@creator"
              />
              <label className="block">
                <span className="mb-1.5 block text-xs text-white/45">Notes</span>
                <textarea
                  value={partnerForm.notes}
                  onChange={(e) =>
                    setPartnerForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2 text-sm text-white"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#FFD700] py-2.5 text-sm font-bold text-[#0d0f12] transition hover:brightness-110"
              >
                Create partner
              </button>
            </form>

            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">Partner</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                    <th className="px-4 py-3 font-medium">Codes</th>
                    <th className="px-4 py-3 font-medium">Uses</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-white/40">
                        No partners yet.
                      </td>
                    </tr>
                  ) : (
                    partners.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 text-white/75">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{p.name}</div>
                          {p.handle && (
                            <div className="text-xs text-white/40">{p.handle}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{p.platform || "—"}</td>
                        <td className="px-4 py-3">{p.promoCodeCount}</td>
                        <td className="px-4 py-3">{p.totalRedemptions}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => togglePartner(p.id, !p.active)}
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              p.active
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-white/5 text-white/40"
                            }`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "codes" && (
          <section className="grid gap-8 lg:grid-cols-[320px_1fr]" aria-label="Promo codes">
            <form
              onSubmit={createCode}
              className="space-y-3 border border-white/10 bg-white/[0.02] p-5"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Create code
              </h2>
              <Field
                label="Code name"
                value={codeForm.code}
                onChange={(v) =>
                  setCodeForm((p) => ({ ...p, code: v.toUpperCase() }))
                }
                required
                placeholder="STREAMER5"
              />
              <label className="block">
                <span className="mb-1.5 block text-xs text-white/45">Partner</span>
                <select
                  required
                  value={codeForm.partnerId}
                  onChange={(e) =>
                    setCodeForm((p) => ({ ...p, partnerId: e.target.value }))
                  }
                  className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2 text-sm text-white"
                >
                  <option value="" disabled>
                    Select partner
                  </option>
                  {partners
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="rounded-lg border border-[#FFD700]/20 bg-[#FFD700]/5 px-3 py-2 text-sm text-[#FFD700]/90">
                Fixed discount: <strong>5%</strong> (first use only)
              </div>
              <Field
                label="Global max uses (optional)"
                value={codeForm.maxUses}
                onChange={(v) =>
                  setCodeForm((p) => ({ ...p, maxUses: v.replace(/\D/g, "") }))
                }
                placeholder="Unlimited"
              />
              <p className="text-[11px] leading-relaxed text-white/35">
                Each follower can use a code only once. The 5% creator discount applies before
                cashback on promo-eligible packs (706+ and Twilight). Entry packs reject codes.
              </p>
              <button
                type="submit"
                disabled={!codeForm.partnerId}
                className="w-full rounded-lg bg-[#FFD700] py-2.5 text-sm font-bold text-[#0d0f12] transition hover:brightness-110 disabled:opacity-50"
              >
                Issue promo code
              </button>
            </form>

            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Partner</th>
                    <th className="px-4 py-3 font-medium">Discount</th>
                    <th className="px-4 py-3 font-medium">Uses</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-white/40">
                        No promo codes yet.
                      </td>
                    </tr>
                  ) : (
                    codes.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 text-white/75">
                        <td className="px-4 py-3 font-mono text-[#FFD700]">{c.code}</td>
                        <td className="px-4 py-3">{c.partnerName}</td>
                        <td className="px-4 py-3">5%</td>
                        <td className="px-4 py-3">
                          {c.useCount}
                          {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleCode(c.id, !c.active)}
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              c.active
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-white/5 text-white/40"
                            }`}
                          >
                            {c.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section aria-label="Purchase history">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Search email, code, player ID…"
                className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2 text-sm text-white sm:max-w-sm"
              />
              <label className="flex items-center gap-2 text-sm text-white/55">
                <input
                  type="checkbox"
                  checked={promoOnly}
                  onChange={(e) => setPromoOnly(e.target.checked)}
                  className="accent-[#FFD700]"
                />
                Promo used only
              </label>
              <button
                type="button"
                onClick={() => loadOrders(orderQuery, promoOnly)}
                className="rounded-lg border border-white/15 px-3.5 py-2 text-sm text-white/70 transition hover:border-white/30"
              >
                Apply
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Paid</th>
                    <th className="px-4 py-3 font-medium">Promo</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-white/40">
                        No matching orders.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="border-b border-white/5 text-white/75">
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {new Date(o.createdAt).toLocaleString("en-GB")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white/90">{o.userEmail}</div>
                          <div className="font-mono text-[11px] text-white/35">
                            {o.mlbbUserId} ({o.mlbbZoneId})
                          </div>
                        </td>
                        <td className="px-4 py-3">{o.productLabel}</td>
                        <td className="px-4 py-3">{formatCents(o.amountCents)}</td>
                        <td className="px-4 py-3">
                          {o.promoUsed ? (
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                              Yes
                              {o.promoDiscountCents > 0
                                ? ` (−${formatCents(o.promoDiscountCents)})`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-white/30">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {o.promoCode ? (
                            <div>
                              <span className="font-mono text-[#FFD700]">{o.promoCode}</span>
                              {o.partnerName && (
                                <div className="text-[11px] text-white/35">
                                  {o.partnerName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{o.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02] px-4 py-4">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p
        className={`mt-2 text-xl font-semibold tabular-nums ${
          accent ? "text-[#FFD700]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-white/45">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2 text-sm text-white placeholder:text-white/25"
      />
    </label>
  );
}
