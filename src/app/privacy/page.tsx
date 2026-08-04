import { LegalShell } from "@/components/LegalShell";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="3 August 2026">
      <p>
        FastPromo processes personal data in line with the EU General Data
        Protection Regulation (GDPR). This Policy explains what we collect and
        why.
      </p>
      <h2>1. Data we process</h2>
      <ul>
        <li>Account email, display name, and authentication credentials (hashed) or Google account link</li>
        <li>In-game User ID and Zone ID (to deliver your order)</li>
        <li>Order history and cashback ledger entries</li>
        <li>Payment metadata via Stripe (we do not store full card numbers)</li>
        <li>Technical logs required for security and fraud prevention</li>
        <li>Optional analytics cookies if you consent</li>
      </ul>
      <h2>2. Purpose & legal bases</h2>
      <p>
        Order fulfillment is based on contract performance. Security logging
        and fraud prevention are based on legitimate interests. Optional
        analytics rely on your consent.
      </p>
      <h2>3. Retention</h2>
      <p>
        Order records are retained as required for accounting, dispute
        resolution, and legal obligations, then deleted or anonymized.
      </p>
      <h2>4. Processors</h2>
      <p>
        We use Stripe for payments and supplier APIs for fulfillment. Discord
        may be used if you contact support. Each processor acts under its own
        privacy terms where applicable.
      </p>
      <h2>5. Your rights</h2>
      <p>
        You may request access, rectification, erasure, restriction, portability,
        or object to certain processing. Contact us via Discord support. You
        may also lodge a complaint with your local supervisory authority.
      </p>
      <h2>6. International transfers</h2>
      <p>
        Some processors may process data outside the EEA with appropriate
        safeguards (such as Standard Contractual Clauses).
      </p>
    </LegalShell>
  );
}
