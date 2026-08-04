import { BrandMark } from "./BrandMark";
import { PaymentMethodsBar } from "./PaymentMethodsBar";
import { getMerchantProfile } from "@/lib/receipt";

const DISCORD_URL = "https://discord.gg/fastpromo";

export function Footer() {
  const merchant = getMerchantProfile();

  return (
    <>
      <PaymentMethodsBar />
      <footer className="relative isolate overflow-hidden border-t border-white/5 bg-[#080a0c]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <BrandMark size="sm" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                Automated diamond top-ups for Europe — secure Stripe checkout,
                direct-to-ID delivery, and support when you need a human.
              </p>
              <dl className="mt-6 space-y-1.5 text-xs leading-relaxed text-white/35">
                <div>
                  <dt className="sr-only">Operator</dt>
                  <dd>{merchant.legalName}</dd>
                </div>
                {merchant.addressLines.length > 0 && (
                  <div>
                    <dt className="sr-only">Address</dt>
                    <dd>{merchant.addressLines.join(", ")}</dd>
                  </div>
                )}
                {merchant.vatId && (
                  <div>
                    <dt className="sr-only">VAT</dt>
                    <dd>VAT / Tax ID: {merchant.vatId}</dd>
                  </div>
                )}
                <div>
                  <dt className="sr-only">Support email</dt>
                  <dd>
                    Support:{" "}
                    <a
                      href={`mailto:${merchant.supportEmail}`}
                      className="text-white/50 transition-colors hover:text-[#FFD700]"
                    >
                      {merchant.supportEmail}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Region</dt>
                  <dd>Serving European players · {merchant.country}</dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Platform
                </p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li>
                    <a href="/packages" className="footer-link">
                      Top-Up
                    </a>
                  </li>
                  <li>
                    <a href="/#how" className="footer-link">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="/#rewards" className="footer-link">
                      Cashback & codes
                    </a>
                  </li>
                  <li>
                    <a href="/faq" className="footer-link">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Support & legal
                </p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li>
                    <a
                      href={DISCORD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-link"
                    >
                      Discord support
                    </a>
                  </li>
                <li>
                  <a href="/legal" className="footer-link">
                    Legal notice
                  </a>
                </li>
                <li>
                  <a href="/terms" className="footer-link">
                    Terms of Service
                  </a>
                </li>
                  <li>
                    <a href="/privacy" className="footer-link">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/cookies" className="footer-link">
                      Cookie Policy
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="footer-link"
                      data-open-cookie-settings
                    >
                      Cookie settings
                    </button>
                  </li>
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Trust
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/45">
                  Stripe Checkout · EUR pricing · GDPR-minded data minimization.
                  We only keep what payment and fulfillment require.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/30">
                  Independent reseller — not affiliated with or endorsed by
                  Moonton or its games.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} {merchant.legalName}. All rights
              reserved.
            </p>
            <p className="text-xs text-white/28">
              Digital goods · Instant delivery after payment confirmation
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
