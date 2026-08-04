import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/cashback-config";
import {
  buildReceiptNumber,
  getMerchantProfile,
  resolveCatalogPriceCents,
} from "@/lib/receipt";
import { PrintReceiptButton } from "@/components/PrintReceiptButton";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function ReceiptPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/account");
  }

  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });

  if (
    !order ||
    (order.status !== "paid" &&
      order.status !== "fulfilled" &&
      order.status !== "failed")
  ) {
    notFound();
  }

  let receiptNumber = order.receiptNumber;
  if (!receiptNumber) {
    receiptNumber = buildReceiptNumber(order.id, order.createdAt);
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptNumber },
    });
  }

  const merchant = getMerchantProfile();
  const catalog = resolveCatalogPriceCents(order);
  const issued = order.createdAt.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const docTitle = merchant.hasLegalIdentity
    ? "Payment receipt"
    : "Order payment receipt";

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-4 py-8 text-[#101828]">
      <div className="mx-auto mb-4 flex max-w-[720px] flex-wrap justify-end gap-2 print:hidden">
        <Link
          href="/account"
          className="rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-2 text-sm text-[#344054]"
        >
          Back to account
        </Link>
        <PrintReceiptButton />
      </div>

      <article className="mx-auto max-w-[720px] border border-[#e4e7ec] bg-white p-8 shadow-[0_8px_30px_rgba(16,24,40,0.06)] sm:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8860b]">
          {merchant.brandName}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#101828]">{docTitle}</h1>
        <p className="mt-2 text-sm text-[#667085]">
          Issued {issued} UTC · Receipt{" "}
          <span className="font-semibold text-[#101828]">{receiptNumber}</span>
        </p>

        <div className="mt-8 grid gap-6 text-sm text-[#344054] sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-[#98a2b3]">
              Merchant
            </p>
            <p className="font-semibold text-[#101828]">{merchant.legalName}</p>
            {merchant.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {merchant.vatId && <p>Tax / VAT ID: {merchant.vatId}</p>}
            <p>Support: {merchant.supportEmail}</p>
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-[#98a2b3]">
              Customer
            </p>
            {order.user.name && (
              <p className="font-semibold text-[#101828]">{order.user.name}</p>
            )}
            <p>{order.user.email}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#101828] text-[11px] uppercase tracking-wider text-[#667085]">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#eceff3]">
              <td className="py-3">
                <p className="font-semibold text-[#101828]">{order.productLabel}</p>
                <p className="text-xs text-[#667085]">
                  Digital top-up · Player {order.mlbbUserId} ({order.mlbbZoneId})
                </p>
              </td>
              <td className="py-3 text-right whitespace-nowrap">
                {formatCents(catalog)}
              </td>
            </tr>
            {order.promoDiscountCents > 0 && (
              <tr className="border-b border-[#eceff3] text-[#667085]">
                <td className="py-2">
                  Creator promo
                  {order.promoCodeSnapshot ? ` (${order.promoCodeSnapshot})` : ""}
                </td>
                <td className="py-2 text-right text-[#027a48]">
                  −{formatCents(order.promoDiscountCents)}
                </td>
              </tr>
            )}
            {order.cashbackAppliedCents > 0 && (
              <tr className="border-b border-[#eceff3] text-[#667085]">
                <td className="py-2">Cashback credit applied</td>
                <td className="py-2 text-right text-[#027a48]">
                  −{formatCents(order.cashbackAppliedCents)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 font-bold">Amount paid</td>
              <td className="pt-4 text-right text-base font-bold">
                {formatCents(order.amountCents)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 rounded-lg border border-[#e4e7ec] bg-[#f8fafc] p-4 text-xs leading-relaxed text-[#475467]">
          <p className="font-semibold text-[#101828]">Payment & delivery</p>
          <p className="mt-1">
            Payment processor: Stripe · Reference: {order.stripeSessionId}
          </p>
          <p>
            Order status: {order.status} · Currency:{" "}
            {order.currency.toUpperCase()}
          </p>
          {order.cashbackEarnedCents > 0 && (
            <p>
              Cashback earned on this order: {formatCents(order.cashbackEarnedCents)}{" "}
              (promotional store credit).
            </p>
          )}
          <p className="mt-1">
            Digital goods are delivered electronically to the in-game account
            identifiers you provided. Keep this receipt for your records.
          </p>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-[#98a2b3]">
          {merchant.hasLegalIdentity
            ? merchant.vatId
              ? `VAT / tax ID: ${merchant.vatId}. This document confirms payment for a digital service.`
              : "This document confirms payment for a digital service. VAT treatment depends on applicable consumer and digital-services rules in your country of residence."
            : "This is a payment confirmation / order receipt for a digital top-up service. It is not a substitute for a formal tax invoice until the merchant’s full legal identity (registered name, address, and tax ID where required) is completed on the platform."}
        </p>
      </article>
    </main>
  );
}
