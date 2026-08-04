const STEPS = [
  {
    n: "01",
    title: "Identify your account",
    text: "Enter your User ID and Zone ID — exactly as shown on your in-game profile.",
  },
  {
    n: "02",
    title: "Choose a package",
    text: "Pick diamonds or a pass from the full catalog. Prices are locked server-side in euros.",
  },
  {
    n: "03",
    title: "Add rewards (optional)",
    text: "Apply a creator code for 5% off larger packs. Earn 2% cashback to your FastPromo wallet — usable for up to 30% of a future order.",
  },
  {
    n: "04",
    title: "Pay securely",
    text: "Checkout with Stripe — cards, Apple Pay, Google Pay, and major EU methods.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative isolate scroll-mt-24 border-y border-white/5 bg-[#0a0c0f] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      aria-labelledby="how-heading"
    >
      <div className="relative mx-auto max-w-6xl">
        <div data-reveal className="reveal mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
            Process
          </p>
          <h2
            id="how-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Four steps. No waiting rooms.
          </h2>
          <p className="mt-4 text-base text-white/60 sm:text-lg">
            Built for European players who want diamonds without intermediaries,
            spreadsheets, or guesswork.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => (
            <li
              key={step.n}
              data-reveal
              className="reveal group"
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <p className="font-[family-name:var(--font-cinzel)] text-3xl font-semibold text-[#FFD700]/35 transition-all duration-300 group-hover:text-[#FFD700]/70">
                {step.n}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
