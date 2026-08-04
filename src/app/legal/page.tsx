import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { getMerchantProfile } from "@/lib/receipt";
import { DISCORD_SUPPORT_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal notice",
  description:
    "FastPromo pilot legal notice: operator contact, digital content rules, age requirement, and dispute options for EU consumers.",
};

export default function LegalNoticePage() {
  const merchant = getMerchantProfile();

  return (
    <LegalShell title="Legal notice (pilot)" updated="4 August 2026">
      <p>
        FastPromo is operating a <strong>limited pilot</strong> to validate
        product, delivery, and support quality before a full commercial
        registration of the operator (e.g. self-employed / company formation).
      </p>

      <h2>1. Operator & contact</h2>
      <ul>
        <li>
          Brand: <strong>{merchant.brandName}</strong>
        </li>
        {merchant.hasLegalIdentity ? (
          <>
            <li>
              Legal name: <strong>{merchant.legalName}</strong>
            </li>
            {merchant.addressLines.length > 0 && (
              <li>Address: {merchant.addressLines.join(", ")}</li>
            )}
            {merchant.vatId && <li>VAT / Tax ID: {merchant.vatId}</li>}
          </>
        ) : (
          <li>
            Full legal name, registered address, and tax ID will be published
            here when operator registration is completed.
          </li>
        )}
        <li>
          Support email:{" "}
          <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>
        </li>
        <li>
          Discord:{" "}
          <a href={DISCORD_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
            {DISCORD_SUPPORT_URL.replace("https://", "")}
          </a>
        </li>
        <li>
          Country focus: {merchant.country} / EU consumers
        </li>
      </ul>

      <h2>2. What the pilot means</h2>
      <ul>
        <li>Payments and diamond deliveries during the pilot are real.</li>
        <li>
          Checkout receipts and emails are <strong>payment confirmations</strong>
          , not formal tax invoices, until the operator’s full legal identity is
          completed and published.
        </li>
        <li>
          Service health notes: <a href="/status">Status page</a>.
        </li>
      </ul>

      <h2>3. Consumer digital content</h2>
      <p>
        Top-ups are digital content delivered promptly after payment. Before
        checkout you must confirm that you want delivery to begin immediately and
        that you understand you lose the 14-day withdrawal right once delivery
        starts, as allowed for digital content under EU consumer rules. See the{" "}
        <a href="/terms">Terms of Service</a> for delivery targets and refund
        rules when fulfillment fails.
      </p>

      <h2>4. Age</h2>
      <p>
        You must be at least 18 years old (or the age of digital consent /
        contract capacity in your country) to place an order.
      </p>

      <h2>5. Disputes</h2>
      <p>
        Contact us first via Discord or email with your Stripe session ID. EU
        consumers may also use the European Commission’s Online Dispute
        Resolution platform:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>6. Documents</h2>
      <p>
        See also our <a href="/terms">Terms</a>, <a href="/privacy">Privacy</a>,{" "}
        <a href="/cookies">Cookie Policy</a>, and <a href="/faq">FAQ</a>. When
        the operator completes registration, this notice will be updated with
        legal name, address, and tax ID.
      </p>
    </LegalShell>
  );
}
