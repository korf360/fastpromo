import Link from "next/link";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim() ?? null;

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
          Your order is confirmed. Diamonds are being delivered to your MLBB
          account — typically within a few seconds.
        </p>
        {sessionId && (
          <p className="mt-4 break-all font-mono text-[11px] text-white/35">
            Session: {sessionId}
          </p>
        )}
        <Link
          href="/"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#FFD700] px-6 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
