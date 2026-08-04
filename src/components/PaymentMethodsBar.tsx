const METHODS = [
  { name: "Visa", logo: "/payment/visa.svg" },
  { name: "Mastercard", logo: "/payment/mastercard.svg" },
  { name: "American Express", logo: "/payment/amex.svg" },
  { name: "PayPal", logo: "/payment/paypal.svg" },
  { name: "Apple Pay", logo: "/payment/applepay.svg" },
  { name: "Google Pay", logo: "/payment/googlepay.svg" },
  { name: "iDEAL", logo: "/payment/ideal.svg" },
  { name: "Bancontact", logo: "/payment/bancontact.svg" },
  { name: "Klarna", logo: "/payment/klarna.svg" },
] as const;

export function PaymentMethodsBar() {
  return (
    <div
      className="relative isolate border-t border-white/5 bg-[#090b0e]"
      role="region"
      aria-label="Accepted payment methods"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/25 to-transparent"
        aria-hidden
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-9 sm:px-6 lg:px-8 lg:py-10">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Secure payments
          </p>
          <p className="mt-1.5 text-sm text-white/45">
            Cards, wallets, and major European methods
          </p>
        </div>
        <ul className="flex w-full flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {METHODS.map(({ name, logo }) => (
            <li key={name}>
              <span
                className="group inline-flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.035] py-2 pl-2 pr-3.5 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.055]"
                title={name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt=""
                  width={38}
                  height={24}
                  className="h-6 w-[38px] shrink-0 rounded-[3px] object-contain shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  loading="lazy"
                  decoding="async"
                />
                <span className="text-xs font-medium tracking-wide text-white/60 transition-colors group-hover:text-white/80 sm:text-[13px]">
                  {name}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
