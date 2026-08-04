import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollEffects } from "@/components/ScrollEffects";
import { getMerchantProfile } from "@/lib/receipt";
import { DISCORD_SUPPORT_URL, getSiteUrl } from "@/lib/site";
import { StatusHealthClient } from "@/components/StatusHealthClient";

export const metadata: Metadata = {
  title: "Status",
  description:
    "FastPromo service status: website health, payments, fulfillment expectations, and how to get help if delivery is delayed.",
};

export default function StatusPage() {
  const merchant = getMerchantProfile();
  const site = getSiteUrl();

  return (
    <>
      <ScrollEffects />
      <Header />
      <main className="relative flex-1">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent_55%)]"
          aria-hidden
        />
        <section className="relative px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div data-reveal className="reveal mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
              Operations
            </p>
            <h1 className="mt-3 text-[1.75rem] font-bold tracking-tight text-white sm:text-5xl">
              Service status
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55">
              Live website health plus what to expect for payments and diamond
              delivery. For Discord live boards, join support and check the
              server status channel.
            </p>

            <StatusHealthClient />

            <div className="mt-8 space-y-3">
              <StatusCard
                title="Payments (Stripe)"
                body="Checkout is hosted by Stripe. Card and wallet payments are processed on Stripe’s infrastructure. If Stripe is globally degraded, checkout may fail until they recover."
              />
              <StatusCard
                title="Fulfillment"
                body="After payment confirmation, top-ups are sent to the User ID and Zone ID you entered. Most deliveries finish within seconds; supplier or game-side delays can take longer."
              />
              <StatusCard
                title="Support"
                body={`Primary channel: Discord. Email: ${merchant.supportEmail}. Include your Stripe session ID (cs_…) or receipt number for faster lookup.`}
              />
            </div>

            <div className="mt-10 border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-white sm:text-base">
                If diamonds did not arrive
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/55">
                <li>Confirm payment succeeded and check your account receipt.</li>
                <li>Verify the User ID and Zone ID you submitted.</li>
                <li>
                  Wait a few minutes — occasional supplier queues delay delivery.
                </li>
                <li>
                  Open a Discord ticket or email us with your session ID / receipt.
                </li>
              </ol>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href={DISCORD_SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#5865F2] px-5 text-sm font-bold text-white transition-all hover:brightness-110"
                >
                  Discord support
                </a>
                <a
                  href={`mailto:${merchant.supportEmail}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
                >
                  Email support
                </a>
                <Link
                  href="/faq"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
                >
                  FAQ
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/35">
                Health endpoint:{" "}
                <a href={`${site}/api/health`} className="text-white/50 hover:text-[#FFD700]">
                  {site}/api/health
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] px-5 py-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  );
}
