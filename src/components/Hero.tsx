export function Hero() {
  return (
    <section
      className="relative overflow-hidden px-4 pb-10 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-14 lg:pt-28"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#FFD700]/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-4 font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-[0.2em] text-[#FFD700] sm:text-base">
          FastPromo
        </p>
        <h1
          id="hero-heading"
          className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Instant MLBB Top-Ups.{" "}
          <span className="text-[#FFD700]">Zero Friction.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Fully automated delivery direct to your player ID via official API
          gateways.
        </p>
      </div>
    </section>
  );
}
