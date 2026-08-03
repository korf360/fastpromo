const DISCORD_URL = "https://discord.gg/fastpromo";

export function SupportCTA() {
  return (
    <section
      id="support"
      className="relative scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="support-heading"
    >
      <div className="reveal mx-auto max-w-6xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#FFD700]/10 via-white/[0.03] to-transparent px-6 py-12 sm:px-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
            Always on
          </p>
          <h2
            id="support-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Real operators. Real-time help.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
            Payment questions, delivery checks, or account troubleshooting —
            our Discord team monitors tickets around the clock so you never
            chase a silent inbox.
          </p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#5865F2] px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
          >
            Join Discord Support
          </a>
        </div>
      </div>
    </section>
  );
}
