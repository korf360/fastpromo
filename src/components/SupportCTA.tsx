const DISCORD_URL = "https://discord.gg/fastpromo";

export function SupportCTA() {
  return (
    <section
      id="support"
      className="relative isolate z-10 scroll-mt-24 border-t border-white/5 bg-[#0a0c0f] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="support-heading"
    >
      <div
        data-reveal
        className="reveal relative mx-auto flex max-w-2xl flex-col items-start text-left sm:items-center sm:text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
          Always on
        </p>
        <h2
          id="support-heading"
          className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Real operators. Real-time help.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
          Payment questions, delivery checks, or account troubleshooting — our
          Discord team monitors tickets around the clock so you never chase a
          silent inbox.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-[#5865F2] px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
          >
            Join Discord Support
          </a>
          <a
            href="/faq"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/80 transition-colors duration-300 hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Read the FAQ
          </a>
        </div>
      </div>
    </section>
  );
}
