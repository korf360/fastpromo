import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { getMerchantProfile } from "@/lib/receipt";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FastPromo processes personal data for EU users under the GDPR: accounts, orders, payments, and your rights.",
};

export default function PrivacyPage() {
  const merchant = getMerchantProfile();

  return (
    <LegalShell title="Privacy Policy" updated="4 August 2026">
      <p>
        This Privacy Policy explains how {merchant.brandName} processes personal
        data in line with the EU General Data Protection Regulation (GDPR) and
        applicable national laws. It applies to our website and related services
        (accounts, top-ups, support).
      </p>

      <h2>1. Controller</h2>
      <p>
        During the current pilot, the service is operated under the brand{" "}
        <strong>{merchant.brandName}</strong>
        {merchant.hasLegalIdentity ? (
          <>
            . Legal operator: <strong>{merchant.legalName}</strong>
            {merchant.addressLines.length > 0 && (
              <>
                , {merchant.addressLines.join(", ")}
              </>
            )}
            {merchant.vatId && <> · VAT / Tax ID: {merchant.vatId}</>}
            .
          </>
        ) : (
          <>
            . Full company registration details are still being completed; see
            the <a href="/legal">Legal notice</a> for the pilot status.
          </>
        )}
      </p>
      <p>
        Privacy contact:{" "}
        <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>
        . Support channel:{" "}
        <a href={merchant.supportUrl} target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        .
      </p>

      <h2>2. Data we process</h2>
      <ul>
        <li>
          Account data: email, display name, password hash (if you register with
          email), or Google account link if you use Google sign-in
        </li>
        <li>
          Order data: product selected, amounts, currency, timestamps, status
        </li>
        <li>
          Delivery identifiers: in-game User ID and Zone ID you submit
        </li>
        <li>
          Payment metadata via Stripe (we do not store full card numbers)
        </li>
        <li>
          Cashback / promo ledger entries linked to your account
        </li>
        <li>
          Technical logs needed for security, fraud prevention, and debugging
          (for example IP address, user agent, error traces for a limited time)
        </li>
        <li>
          Essential cookies and local storage as described in the{" "}
          <a href="/cookies">Cookie Policy</a>
        </li>
      </ul>
      <p>
        We do <strong>not</strong> currently run analytics or advertising
        cookies on our site.
      </p>

      <h2>3. Purposes and legal bases</h2>
      <ul>
        <li>
          <strong>Contract</strong> — creating an account, processing top-up
          orders, delivering digital goods, sending payment confirmations
        </li>
        <li>
          <strong>Legal obligation</strong> — keeping records needed for
          accounting, tax, or dispute resolution where applicable
        </li>
        <li>
          <strong>Legitimate interests</strong> — securing the service, preventing
          fraud/abuse, improving reliability (balanced against your rights)
        </li>
        <li>
          <strong>Consent</strong> — only if we later introduce optional
          analytics/marketing cookies (not used today)
        </li>
      </ul>

      <h2>4. Retention</h2>
      <ul>
        <li>
          Account profile: while your account remains open, then deleted or
          anonymized within a reasonable period after closure or inactivity,
          unless we must keep data longer
        </li>
        <li>
          Orders and payment confirmations: retained as needed for accounting,
          chargebacks, and legal claims (typically several years where required)
        </li>
        <li>
          Security logs: kept only as long as needed for the security purpose,
          then deleted or aggregated
        </li>
        <li>
          Cookie preferences in local storage: until you clear site data
        </li>
      </ul>

      <h2>5. Processors and recipients</h2>
      <ul>
        <li>
          <strong>Stripe</strong> — payment processing
        </li>
        <li>
          <strong>Hosting / infrastructure</strong> — typically Vercel (and
          related edge/CDN) for the website
        </li>
        <li>
          <strong>Database</strong> — hosted database provider used for accounts
          and orders (configured for this deployment)
        </li>
        <li>
          <strong>Email</strong> — transactional mail provider (e.g. Resend) for
          receipts when configured
        </li>
        <li>
          <strong>Fulfillment supplier APIs</strong> — to deliver the digital
          top-up to the IDs you provide
        </li>
        <li>
          <strong>Google</strong> — only if you choose Google sign-in
        </li>
        <li>
          <strong>Discord</strong> — if you contact us there for support
        </li>
      </ul>
      <p>
        Each provider processes data under its own terms and, where required,
        under a data-processing arrangement with us.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Some providers may process data outside the EEA (for example in the
        United States). Where that happens, we rely on appropriate safeguards
        such as the EU Standard Contractual Clauses or an adequacy decision,
        as offered by the provider.
      </p>

      <h2>7. Your rights</h2>
      <p>Under the GDPR you may have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Rectify inaccurate data</li>
        <li>Erase data (in certain cases)</li>
        <li>Restrict or object to certain processing</li>
        <li>Data portability (where applicable)</li>
        <li>Withdraw consent later, if processing was based on consent</li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>{" "}
        from the address on your account and describe your request. You may also
        lodge a complaint with your local data protection authority in the EU /
        EEA.
      </p>

      <h2>8. Children</h2>
      <p>
        The service is aimed at adults. You must be at least 18 (or the age of
        contractual capacity where you live) to place an order.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy when our practices or legal requirements
        change. The “Last updated” date at the top will change accordingly.
      </p>

      <h2>10. Related documents</h2>
      <p>
        <a href="/cookies">Cookie Policy</a> · <a href="/terms">Terms of Service</a>{" "}
        · <a href="/legal">Legal notice</a>
      </p>
    </LegalShell>
  );
}
