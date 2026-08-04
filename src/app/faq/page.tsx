import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollEffects } from "@/components/ScrollEffects";
import {
  getCashbackPercent,
  getCashbackWalletCoverPercent,
} from "@/lib/cashback-config";
import { getMerchantProfile } from "@/lib/receipt";
import { DISCORD_SUPPORT_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about FastPromo top-ups: IDs, delivery times, refunds, cashback wallet, creator codes, and Discord support.",
};

export default function FaqPage() {
  const cashback = getCashbackPercent();
  const cover = getCashbackWalletCoverPercent();
  const merchant = getMerchantProfile();

  const faqs = [
    {
      q: "Is FastPromo still in pilot / testing?",
      a: "Yes. We are validating delivery and support before full operator registration. Orders and payments are real; receipts are payment confirmations until a full tax identity is published. See the Legal notice for details.",
    },
    {
      q: "Where do I find my User ID and Zone ID?",
      a: "Open the game → tap your avatar → copy the numeric User ID and Zone ID shown on your profile. Enter them exactly. Diamonds go to the ID you submit — double-check before paying.",
    },
    {
      q: "How fast is delivery?",
      a: "Most orders deliver within seconds after Stripe confirms payment. Occasional supplier or game-side delays can take longer. If nothing arrives after a few minutes, open a Discord ticket or email us with your Stripe session ID or receipt. See Status for operational notes.",
    },
    {
      q: "What if payment succeeded but I got no diamonds?",
      a: "Wait a few minutes first. Then contact Discord support or email us with your Stripe session ID (cs_…) or receipt number. We investigate failed fulfillments and re-deliver or refund as appropriate. Do not enter a different ID and reorder without checking with support.",
    },
    {
      q: "Can I get a refund?",
      a: "Digital top-ups that were successfully delivered to the IDs you provided are generally non-refundable (you consent to immediate delivery at checkout). If fulfillment fails after payment, we resolve via re-delivery or refund. Wrong IDs entered by you usually cannot be reversed.",
    },
    {
      q: `How does the ${cashback}% cashback wallet work?`,
      a: `Every paid order earns ${cashback}% back as FastPromo wallet credit (store credit, not withdrawable cash). On your next top-up you can apply that balance — up to ${cover}% of the order total after any promo. The rest is paid with Stripe.`,
    },
    {
      q: "What are creator promo codes?",
      a: "Partners can issue one-time codes for 5% off larger packs (706 Diamonds and above, plus Twilight Pass). Entry packs are excluded. Codes are validated at checkout and only work once per account.",
    },
    {
      q: "Which regions / accounts work?",
      a: "FastPromo targets European players with EUR pricing. Use the correct Global / region ID for your in-game account. If you are unsure your zone is supported, ask on Discord before ordering.",
    },
    {
      q: "How do I get support?",
      a: `Primary support is on Discord (${DISCORD_SUPPORT_URL.replace("https://", "")}). You can also email ${merchant.supportEmail}. Include your order receipt or Stripe session ID so we can look up the payment quickly.`,
    },
    {
      q: "Are you affiliated with the game publisher?",
      a: "No. FastPromo is an independent reseller. We are not affiliated with or endorsed by Moonton or its games.",
    },
  ];

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
              Help
            </p>
            <h1 className="mt-3 text-[1.75rem] font-bold tracking-tight text-white sm:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55">
              Straight answers on IDs, delivery, refunds, wallet cashback, and
              support — before you top up.
            </p>

            <div className="mt-10 space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group border border-white/10 bg-white/[0.02] open:border-[#FFD700]/25 open:bg-[#FFD700]/[0.04]"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 text-left text-sm font-semibold text-white marker:content-none sm:text-base [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.q}
                      <span
                        className="mt-0.5 shrink-0 text-[#FFD700]/70 transition-transform duration-300 group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="border-t border-white/5 px-5 pb-5 pt-3 text-sm leading-relaxed text-white/55">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>

            <p className="mt-10 text-sm text-white/45">
              Still stuck?{" "}
              <a
                href={DISCORD_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#FFD700] hover:underline"
              >
                Ask on Discord
              </a>
              {" · "}
              <Link href="/status" className="font-medium text-[#FFD700] hover:underline">
                Status
              </Link>
              {" · "}
              <Link href="/packages" className="font-medium text-[#FFD700] hover:underline">
                Go to top-up
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
