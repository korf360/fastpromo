import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCents, getCashbackPercent, getCashbackWalletCoverPercent } from "@/lib/cashback-config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  AccountSettings,
  OrderStatusBadge,
  OrderStatusTrack,
} from "@/components/AccountSettings";

function formatMemberSince(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 50 },
      cashbackLedger: { orderBy: { createdAt: "desc" }, take: 100 },
      promoRedemptions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          promoCode: {
            select: {
              code: true,
              partner: { select: { name: true } },
            },
          },
          order: {
            select: {
              productLabel: true,
              promoDiscountCents: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login?next=/account");
  }

  const percent = getCashbackPercent();
  const walletCoverPercent = getCashbackWalletCoverPercent();

  const [earnedAgg, redeemedAgg, fulfilledCount] = await Promise.all([
    prisma.cashbackEntry.aggregate({
      where: { userId: user.id, amountCents: { gt: 0 } },
      _sum: { amountCents: true },
    }),
    prisma.cashbackEntry.aggregate({
      where: { userId: user.id, amountCents: { lt: 0 } },
      _sum: { amountCents: true },
    }),
    prisma.order.count({
      where: { userId: user.id, status: "fulfilled" },
    }),
  ]);

  const totalEarnedCents = earnedAgg._sum.amountCents ?? 0;
  const totalRedeemedCents = Math.abs(redeemedAgg._sum.amountCents ?? 0);
  const totalOrders = await prisma.order.count({ where: { userId: user.id } });

  return (
    <>
      <Header />
      <main className="relative flex-1">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent_55%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
                Account
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {user.name || "Your dashboard"}
              </h1>
              <p className="mt-2 text-sm text-white/55">{user.email}</p>
              <p className="mt-2 text-xs text-white/35">
                Member since {formatMemberSince(user.createdAt)}
                {fulfilledCount > 0
                  ? ` · ${fulfilledCount} delivered top-up${fulfilledCount === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.user.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex min-h-11 items-center rounded-lg border border-[#FFD700]/40 px-4 py-2.5 text-sm font-semibold text-[#FFD700] transition-all duration-300 hover:bg-[#FFD700]/10"
                >
                  Admin panel
                </Link>
              )}
              <Link
                href="/packages"
                className="inline-flex min-h-11 items-center rounded-lg bg-[#FFD700] px-4 py-2.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110"
              >
                New top-up
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition-all duration-300 hover:border-white/30"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <section className="mt-10" aria-labelledby="cashback-summary-heading">
            <h2 id="cashback-summary-heading" className="sr-only">
              Cashback summary
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-[#FFD700]/25 bg-[#FFD700]/5 p-5">
                <p className="text-xs uppercase tracking-wider text-[#FFD700]/70">
                  Wallet balance
                </p>
                <p className="mt-2 text-2xl font-bold text-[#FFD700]">
                  {formatCents(user.cashbackCents)}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  Ready to redeem on your next top-up
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Total cashback earned
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCents(totalEarnedCents)}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  Lifetime credit from completed orders ({percent}%)
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Total redeemed
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCents(totalRedeemedCents)}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  Applied to past checkouts
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Orders
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{totalOrders}</p>
                <p className="mt-2 text-xs text-white/40">
                  Cashback is promotional credit — see{" "}
                  <Link href="/terms" className="text-[#FFD700] hover:underline">
                    Terms
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="mt-4 border border-white/10 bg-white/[0.02] px-5 py-4 text-sm leading-relaxed text-white/55">
              <p className="font-medium text-white/80">How your wallet works</p>
              <ul className="mt-2 space-y-1.5 text-white/50">
                <li>
                  Earn{" "}
                  <span className="text-white/70">{percent}%</span> cashback on
                  every paid order — credited to this wallet after payment.
                </li>
                <li>
                  At checkout, wallet credit can cover up to{" "}
                  <span className="text-white/70">{walletCoverPercent}%</span> of
                  the order total (after any promo). The rest is paid with Stripe.
                </li>
                <li>
                  Credit is store credit only — not withdrawable cash. Toggle it
                  on when you top up on the packages page.
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-12" aria-labelledby="settings-heading">
            <h2 id="settings-heading" className="text-xl font-semibold text-white">
              Profile & security
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Update your display name or password. Player IDs stay per checkout so you can
              top up any account — including gifts.
            </p>
            <div className="mt-5">
              <AccountSettings
                initialName={user.name ?? ""}
                email={user.email}
              />
            </div>
          </section>

          <section className="mt-12" aria-labelledby="creator-codes-heading">
            <h2 id="creator-codes-heading" className="text-xl font-semibold text-white">
              Creator codes used
            </h2>
            <p className="mt-1 text-sm text-white/45">
              One-time 5% partner promos applied to your purchases
            </p>
            {user.promoRedemptions.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">
                You haven&apos;t used a creator code yet. Enter one at checkout if a streamer
                shared theirs with you.
              </p>
            ) : (
              <>
                <div className="mt-4 space-y-3 md:hidden">
                  {user.promoRedemptions.map((r) => (
                    <div
                      key={r.id}
                      className="border border-white/10 bg-white/[0.02] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-mono text-sm text-[#FFD700]">
                          {r.promoCode.code}
                        </p>
                        <p className="text-sm text-emerald-300">
                          {r.order.promoDiscountCents > 0
                            ? `−${formatCents(r.order.promoDiscountCents)}`
                            : "—"}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-white/70">
                        {r.promoCode.partner.name}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {r.createdAt.toLocaleString("en-GB")} · {r.order.productLabel}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 hidden overflow-x-auto border border-white/10 md:block">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Code</th>
                        <th className="px-4 py-3 font-medium">Partner</th>
                        <th className="px-4 py-3 font-medium">Order</th>
                        <th className="px-4 py-3 font-medium text-right">Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.promoRedemptions.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-white/5 text-white/75"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.createdAt.toLocaleString("en-GB")}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#FFD700]">
                            {r.promoCode.code}
                          </td>
                          <td className="px-4 py-3">{r.promoCode.partner.name}</td>
                          <td className="px-4 py-3 text-white/55">
                            {r.order.productLabel}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-300">
                            {r.order.promoDiscountCents > 0
                              ? `−${formatCents(r.order.promoDiscountCents)}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="mt-12" aria-labelledby="cashback-history-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="cashback-history-heading"
                  className="text-xl font-semibold text-white"
                >
                  Cashback history
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Every earn and redeem movement on your account
                </p>
              </div>
              {totalEarnedCents > 0 && (
                <p className="mt-1 text-sm text-white/50">
                  Lifetime total:{" "}
                  <span className="font-semibold text-[#FFD700]">
                    {formatCents(totalEarnedCents)}
                  </span>
                </p>
              )}
            </div>

            {user.cashbackLedger.length === 0 ? (
              <div className="mt-4 border border-dashed border-white/10 px-5 py-8 text-sm text-white/50">
                No cashback yet. Complete a top-up to start earning {percent}%.
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3 md:hidden">
                  {user.cashbackLedger.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-white/10 bg-white/[0.02] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`capitalize text-sm ${
                            entry.type === "earn"
                              ? "text-emerald-300"
                              : entry.type === "redeem"
                                ? "text-white/70"
                                : "text-white/60"
                          }`}
                        >
                          {entry.type}
                        </span>
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            entry.amountCents >= 0
                              ? "text-[#FFD700]"
                              : "text-red-400"
                          }`}
                        >
                          {entry.amountCents >= 0 ? "+" : ""}
                          {formatCents(entry.amountCents)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/40">
                        {entry.createdAt.toLocaleString("en-GB")}
                      </p>
                      {entry.note ? (
                        <p className="mt-1 text-sm text-white/55">{entry.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-4 hidden overflow-x-auto border border-white/10 md:block">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Details</th>
                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.cashbackLedger.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-white/5 text-white/75"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {entry.createdAt.toLocaleString("en-GB")}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            <span
                              className={
                                entry.type === "earn"
                                  ? "text-emerald-300"
                                  : entry.type === "redeem"
                                    ? "text-white/70"
                                    : "text-white/60"
                              }
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/50">
                            {entry.note || "—"}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium tabular-nums ${
                              entry.amountCents >= 0
                                ? "text-[#FFD700]"
                                : "text-red-400"
                            }`}
                          >
                            {entry.amountCents >= 0 ? "+" : ""}
                            {formatCents(entry.amountCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="mt-12" aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="text-xl font-semibold text-white">
              Purchase history
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Player ID is entered per order so you can gift diamonds to friends anytime
            </p>
            {user.orders.length === 0 ? (
              <div className="mt-4 border border-dashed border-white/10 px-5 py-8 text-sm text-white/50">
                No orders yet.{" "}
                <Link href="/packages" className="text-[#FFD700] hover:underline">
                  Place your first top-up
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3 md:hidden">
                  {user.orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-white/10 bg-white/[0.02] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-white">
                            {order.productLabel}
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            {order.createdAt.toLocaleString("en-GB")}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <OrderStatusTrack status={order.status} />
                      <p className="mt-3 font-mono text-xs text-white/55">
                        {order.mlbbUserId} ({order.mlbbZoneId})
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="text-white/80">
                          {formatCents(order.amountCents)}
                        </span>
                        {order.cashbackEarnedCents > 0 && (
                          <span className="text-[#FFD700]">
                            +{formatCents(order.cashbackEarnedCents)} cashback
                          </span>
                        )}
                        {order.promoCodeSnapshot && (
                          <span className="font-mono text-xs text-[#FFD700]/90">
                            {order.promoCodeSnapshot}
                          </span>
                        )}
                      </div>
                      {(order.status === "paid" ||
                        order.status === "fulfilled" ||
                        order.status === "failed") && (
                        <Link
                          href={`/account/receipt/${order.id}`}
                          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/10 px-3 text-sm font-semibold text-[#FFD700] transition hover:bg-[#FFD700]/20"
                        >
                          View receipt
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 hidden overflow-x-auto border border-white/10 md:block">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Player</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Promo</th>
                        <th className="px-4 py-3 font-medium">Cashback</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-white/5 text-white/75"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {order.createdAt.toLocaleString("en-GB")}
                          </td>
                          <td className="px-4 py-3">{order.productLabel}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {order.mlbbUserId} ({order.mlbbZoneId})
                          </td>
                          <td className="px-4 py-3">
                            {formatCents(order.amountCents)}
                          </td>
                          <td className="px-4 py-3">
                            {order.promoCodeSnapshot ? (
                              <span className="font-mono text-xs text-[#FFD700]">
                                {order.promoCodeSnapshot}
                                {order.promoDiscountCents > 0
                                  ? ` (−${formatCents(order.promoDiscountCents)})`
                                  : ""}
                              </span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#FFD700]/90">
                            {order.cashbackEarnedCents > 0
                              ? `+${formatCents(order.cashbackEarnedCents)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status} />
                            <OrderStatusTrack status={order.status} />
                          </td>
                          <td className="px-4 py-3">
                            {order.status === "paid" ||
                            order.status === "fulfilled" ||
                            order.status === "failed" ? (
                              <Link
                                href={`/account/receipt/${order.id}`}
                                className="inline-flex min-h-11 items-center text-sm font-semibold text-[#FFD700] hover:underline"
                              >
                                View
                              </Link>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
