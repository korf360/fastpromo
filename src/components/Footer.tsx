import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { PaymentMethodsBar } from "./PaymentMethodsBar";
import { getMerchantProfile } from "@/lib/receipt";
import { DISCORD_SUPPORT_URL } from "@/lib/site";

export function Footer() {
  const merchant = getMerchantProfile();

  return (
    <>
      <PaymentMethodsBar />
      <footer className="relative isolate overflow-hidden bg-[#07090b]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,215,0,0.06),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-12 lg:gap-y-0">
            <div className="lg:col-span-5">
              <BrandMark size="sm" />
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/50">
                Automated diamond top-ups for Europe — secure checkout,
                direct-to-ID delivery, and human support when you need it.
              </p>
              {!merchant.hasLegalIdentity && (
                <p className="mt-4 max-w-sm border-l border-[#FFD700]/35 pl-3 text-xs leading-relaxed text-white/40">
                  Limited pilot —{" "}
                  <a
                    href="/legal"
                    className="text-white/55 underline-offset-2 transition-colors hover:text-[#FFD700] hover:underline"
                  >
                    legal notice
                  </a>
                  . Full operator identity publishes when registration is
                  complete.
                </p>
              )}

              <div className="mt-8 space-y-2 text-xs leading-relaxed text-white/38">
                <p className="font-medium text-white/50">{merchant.legalName}</p>
                {merchant.addressLines.length > 0 && (
                  <p>{merchant.addressLines.join(", ")}</p>
                )}
                {merchant.vatId && <p>VAT / Tax ID: {merchant.vatId}</p>}
                <p>
                  <a
                    href={`mailto:${merchant.supportEmail}`}
                    className="text-white/50 transition-colors hover:text-[#FFD700]"
                  >
                    {merchant.supportEmail}
                  </a>
                </p>
                <p>European players · {merchant.country}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7">
              <FooterCol title="Platform">
                <FooterLink href="/packages">Top-Up</FooterLink>
                <FooterLink href="/#how">How it works</FooterLink>
                <FooterLink href="/#rewards">Cashback & codes</FooterLink>
                <FooterLink href="/faq">FAQ</FooterLink>
                <FooterLink href="/status">Status</FooterLink>
              </FooterCol>

              <FooterCol title="Support">
                <FooterLink href={DISCORD_SUPPORT_URL} external>
                  Discord
                </FooterLink>
                <FooterLink href={`mailto:${merchant.supportEmail}`}>
                  Email
                </FooterLink>
                <FooterLink href="/account">Account</FooterLink>
                <li>
                  <button
                    type="button"
                    className="footer-link"
                    data-open-cookie-settings
                  >
                    Cookie settings
                  </button>
                </li>
              </FooterCol>

              <FooterCol title="Legal" className="col-span-2 sm:col-span-1">
                <FooterLink href="/legal">Legal notice</FooterLink>
                <FooterLink href="/terms">Terms of Service</FooterLink>
                <FooterLink href="/privacy">Privacy Policy</FooterLink>
                <FooterLink href="/cookies">Cookie Policy</FooterLink>
              </FooterCol>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-white/40">
                © {new Date().getFullYear()} {merchant.legalName}. All rights
                reserved.
              </p>
              <p className="mt-1.5 max-w-md text-[11px] leading-relaxed text-white/28">
                Independent reseller — not affiliated with or endorsed by
                Moonton or its games.
              </p>
            </div>
            <p className="text-[11px] tracking-wide text-white/30 sm:text-right">
              EUR · Stripe Checkout · Essential cookies only
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterCol({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        className="footer-link"
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    </li>
  );
}
