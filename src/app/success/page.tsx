import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim() ?? null;
  const session = await auth();

  let receiptHref: string | null = null;
  let customerEmail: string | null = null;

  if (sessionId && session?.user?.id) {
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: sessionId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        user: { select: { email: true } },
      },
    });
    if (
      order &&
      (order.status === "paid" ||
        order.status === "fulfilled" ||
        order.status === "failed")
    ) {
      receiptHref = `/account/receipt/${order.id}`;
    }
    customerEmail = order?.user.email ?? session.user.email ?? null;
  }

  return (
    <main className="bg-gaming relative flex min-h-screen flex-col items-center justify-center px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-60"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
        <p className="font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-[0.2em] text-[#FFD700]">
          FastPromo
        </p>
        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
          Payment received
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Your order is confirmed. Diamonds are being delivered to your
          account — typically within a few seconds.
        </p>
        {customerEmail && (
          <p className="mt-4 text-sm text-white/55">
            A purchase receipt is on its way to{" "}
            <span className="text-white/85">{customerEmail}</span>. You can also
            open it anytime from your account.
          </p>
        )}
        {sessionId && (
          <p className="mt-4 break-all font-mono text-[11px] text-white/35">
            Session: {sessionId}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-2">
          {receiptHref && (
            <Link
              href={receiptHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#FFD700]/40 px-6 py-3.5 text-sm font-semibold text-[#FFD700] transition-all duration-300 hover:bg-[#FFD700]/10"
            >
              View receipt
            </Link>
          )}
          <Link
            href="/account"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white/80 transition-all duration-300 hover:border-white/30"
          >
            Go to account
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#FFD700] px-6 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
