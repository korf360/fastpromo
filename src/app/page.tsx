import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeatureSplit } from "@/components/FeatureSplit";
import { HowItWorks } from "@/components/HowItWorks";
import { SupportCTA } from "@/components/SupportCTA";
import { Footer } from "@/components/Footer";
import { ScrollEffects } from "@/components/ScrollEffects";

export default function Home() {
  return (
    <>
      <ScrollEffects />
      <Header />
      <main className="relative flex-1">
        <Hero />

        <FeatureSplit
          id="why"
          tone="base"
          eyebrow="Why FastPromo"
          title="Speed without the stress."
          body="Manual resellers and slow portals waste ranked time. FastPromo is built as an automated pipeline — payment clears, diamonds inject, you queue back in."
          points={[
            "Typical delivery around five seconds after payment confirmation",
            "Direct-to-ID fulfillment — no gift codes to redeem",
            "Transparent euro pricing with no surprise currency conversion theatre",
          ]}
          imageSrc="/images/section-speed.jpg"
          imageAlt="Abstract visualization of instant diamond delivery speed"
        />

        <FeatureSplit
          id="security"
          tone="deep"
          eyebrow="Payments & trust"
          title="Checkout built for Europe."
          body="Every order runs through Stripe Checkout with server-side price verification. We never trust client-sent amounts, and we never ask you to DM payment details."
          points={[
            "Cards, Apple Pay, Google Pay, and major EU payment methods",
            "Encrypted checkout hosted by Stripe — FastPromo never sees full card data",
            "GDPR-minded data minimization: only what fulfillment requires",
          ]}
          imageSrc="/images/section-security.jpg"
          imageAlt="Secure payment and protection concept in gold and charcoal"
          reverse
        />

        <HowItWorks />

        <FeatureSplit
          id="rewards"
          tone="base"
          eyebrow="Rewards"
          title="Cashback and creator codes, built into checkout."
          body="Every paid order earns 2% back into your FastPromo wallet. Spend that credit on your next top-up — up to 30% of the order total. Have a creator code? Apply it once for five percent off larger packs."
          points={[
            "2% cashback credited to your FastPromo wallet after payment",
            "Wallet credit can cover up to 30% of your next order (rest via Stripe)",
            "Creator promo codes: one-time 5% off on packs from 706 diamonds and Twilight Pass",
            "Validated instantly at checkout — only real creator codes apply",
          ]}
          imageSrc="/images/section-rewards.jpg"
          imageAlt="Gold-edged diamond tokens and a sealed reward voucher on a dark surface"
          reverse
          ctaHref="/packages"
          ctaLabel="Use rewards at checkout"
        />

        <section
          className="relative isolate z-10 border-y border-white/5 bg-[#0a0c0f] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
          aria-labelledby="cta-packages-heading"
        >
          <div
            data-reveal
            className="reveal relative mx-auto flex max-w-2xl flex-col items-center text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
              Ready when you are
            </p>
            <h2
              id="cta-packages-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Pick a package and top up in seconds.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/55">
              Full catalog, FastPromo wallet cashback (2%, up to 30% of next
              order), optional creator promo, and Stripe checkout — all on the
              packages page.
            </p>
            <a
              href="/packages"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FFD700] px-6 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start Top-Up
            </a>
          </div>
        </section>

        <FeatureSplit
          tone="base"
          eyebrow="Human support"
          title="When automation needs a human."
          body="Most orders never need a ticket. When something looks off — wrong zone, delayed supplier, payment edge cases — our Discord operators step in with live context."
          points={[
            "Dedicated ticket channels with staff visibility",
            "Order lookups via Stripe session ID",
            "Community space for ranks, vouchers, and squads",
          ]}
          imageSrc="/images/section-support.jpg"
          imageAlt="Professional 24/7 gaming support atmosphere"
        />

        <SupportCTA />
      </main>
      <Footer />
    </>
  );
}
