const METHODS = [
  { name: "Visa", logo: "/payment/visa.svg" },
  { name: "Mastercard", logo: "/payment/mastercard.svg" },
  { name: "American Express", logo: "/payment/amex.svg" },
  { name: "Apple Pay", logo: "/payment/applepay.svg" },
  { name: "Google Pay", logo: "/payment/googlepay.svg" },
  { name: "iDEAL", logo: "/payment/ideal.svg" },
  { name: "Bancontact", logo: "/payment/bancontact.svg" },
  { name: "Klarna", logo: "/payment/klarna.svg" },
] as const;

export function PaymentMethodsBar() {
  return (
    <div
      className="relative isolate border-t border-white/5 bg-[#0a0c0f]"
      role="region"
      aria-label="Accepted payment methods"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:px-6 lg:px-8 lg:py-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Secure payments via Stripe
        </p>
        <ul className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {METHODS.map(({ name, logo }) => (
            <li key={name}>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3 text-xs font-medium tracking-wide text-white/55 sm:text-[13px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt=""
                  width={38}
                  height={24}
                  className="h-6 w-[38px] shrink-0 rounded-[3px] object-contain shadow-sm"
                  loading="lazy"
                  decoding="async"
                />
                {name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
