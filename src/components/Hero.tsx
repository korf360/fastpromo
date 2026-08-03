import Image from "next/image";

export function Hero() {
  return (
    <section
      className="relative isolate min-h-[88vh] overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <Image
        src="/images/hero-mlbb.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0d0f12]/75 via-[#0d0f12]/55 to-[#0d0f12]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0d0f12_75%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
        <div className="reveal max-w-2xl">
          <p className="mb-4 font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-[0.22em] text-[#FFD700] sm:text-base">
            FastPromo
          </p>
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Instant MLBB Top-Ups.{" "}
            <span className="text-[#FFD700]">Zero Friction.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            Europe&apos;s automated diamond gateway — pay once, diamonds land
            on your player ID in seconds via official API routes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#top-up"
              className="inline-flex items-center justify-center rounded-xl bg-[#FFD700] px-6 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start Top-Up
            </a>
            <a
              href="#why"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-[#FFD700]/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
            >
              Why FastPromo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
