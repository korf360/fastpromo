import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { FeatureSplit } from "@/components/FeatureSplit";
import { HowItWorks } from "@/components/HowItWorks";
import { TopUpFlow } from "@/components/TopUpFlow";
import { SupportCTA } from "@/components/SupportCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative flex-1">
        <Hero />
        <TrustBar />

        <FeatureSplit
          id="why"
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

        <section
          id="top-up"
          className="relative scroll-mt-24 px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20"
          aria-labelledby="topup-heading"
        >
          <div className="reveal mx-auto mb-2 max-w-6xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
              Order now
            </p>
            <h2
              id="topup-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Top up in two precise steps
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
              Enter your player IDs, select a package, and proceed to secure
              Stripe payment. Diamonds follow automatically.
            </p>
          </div>
          <TopUpFlow />
        </section>

        <FeatureSplit
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
