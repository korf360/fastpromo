import { LegalShell } from "@/components/LegalShell";
import { getMerchantProfile } from "@/lib/receipt";

export default function LegalNoticePage() {
  const merchant = getMerchantProfile();

  return (
    <LegalShell title="Legal notice (pilot)" updated="4 August 2026">
      <p>
        FastPromo is operating a <strong>limited pilot</strong> to validate
        product, delivery, and support quality before a full commercial
        registration of the operator (e.g. self-employed / company formation).
      </p>

      <h2>1. What this means</h2>
      <ul>
        <li>Payments and diamond deliveries during the pilot are real.</li>
        <li>
          Checkout receipts and emails are <strong>payment confirmations</strong>
          , not formal tax invoices, until the operator’s full legal identity is
          completed and published.
        </li>
        <li>
          Support contact:{" "}
          <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>{" "}
          and Discord (see site footer).
        </li>
        <li>
          Brand: {merchant.brandName}. Country focus: {merchant.country} / EU
          consumers.
        </li>
      </ul>

      <h2>2. Consumer digital content</h2>
      <p>
        Top-ups are digital content delivered promptly after payment. Before
        checkout you must confirm that you want delivery to begin immediately and
        that you understand you lose the 14-day withdrawal right once delivery
        starts, as allowed for digital content under EU consumer rules.
      </p>

      <h2>3. Age</h2>
      <p>
        You must be at least 18 years old (or the age of digital consent /
        contract capacity in your country) to place an order.
      </p>

      <h2>4. Disputes</h2>
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

      <h2>5. Documents</h2>
      <p>
        See also our <a href="/terms">Terms</a>, <a href="/privacy">Privacy</a>,
        and <a href="/cookies">Cookie Policy</a>. When the operator completes
        registration, this notice will be updated with legal name, address, and
        tax ID.
      </p>
    </LegalShell>
  );
}
