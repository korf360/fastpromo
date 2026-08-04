import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TopUpFlow } from "@/components/TopUpFlow";
import { PRODUCT_CATALOG } from "@/lib/products";

export const metadata: Metadata = {
  title: "Top-Up",
  description:
    "Buy diamonds in EUR with automated delivery and Discord support. Transparent European pricing.",
};

export default function PackagesPage() {
  const count = Object.keys(PRODUCT_CATALOG).length;

  return (
    <>
      <Header />
      <main className="relative flex-1 bg-[#0d0f12]">
        <section className="relative px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
              Top-Up
            </p>
            <h1 className="mt-3 max-w-2xl text-[1.75rem] font-bold tracking-tight text-white sm:text-5xl">
              Diamonds for your account — priced in euros.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
              Choose from {count} diamond and pass packages, pay securely, and get
              diamonds delivered straight to your player ID.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/45">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#FFD700]" aria-hidden />
                EUR pricing
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#FFD700]" aria-hidden />
                2% wallet cashback
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#FFD700]" aria-hidden />
                Auto delivery
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#FFD700]" aria-hidden />
                Discord support
              </li>
            </ul>
          </div>
        </section>

        <section
          id="top-up"
          className="relative scroll-mt-24 px-4 pb-12 pt-2 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8 lg:pb-20"
          aria-labelledby="packages-topup-heading"
        >
          <h2 id="packages-topup-heading" className="sr-only">
            Select a package and check out
          </h2>
          <TopUpFlow />
        </section>
      </main>
      <Footer />
    </>
  );
}
