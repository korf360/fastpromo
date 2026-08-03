export function TrustBar() {
  return (
    <section
      className="border-b border-white/5 px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Trust signals"
    >
      <div className="reveal mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-8">
        <p className="text-center text-sm text-white/45 sm:text-left">
          Engineered for the European market — transparent EUR pricing, GDPR
          posture, and automated fulfillment.
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-wider text-white/40">
          <li>Stripe Checkout</li>
          <li className="text-white/20" aria-hidden="true">
            ·
          </li>
          <li>API Delivery</li>
          <li className="text-white/20" aria-hidden="true">
            ·
          </li>
          <li>GDPR Ready</li>
          <li className="text-white/20" aria-hidden="true">
            ·
          </li>
          <li>24/7 Discord</li>
        </ul>
      </div>
    </section>
  );
}
