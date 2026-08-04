import { LegalShell } from "@/components/LegalShell";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="4 August 2026">
      <p>
        These Terms govern your use of the FastPromo website and diamond top-up
        services (“Services”). By placing an order you agree to these Terms.
      </p>

      <h2>1. Pilot / limited launch</h2>
      <p>
        FastPromo may operate as a limited pilot while the operator validates
        the service. During the pilot, payment confirmations may not yet
        constitute a full fiscal invoice. See the{" "}
        <a href="/legal">Legal notice</a> for current operator contact details.
      </p>

      <h2>2. Service description</h2>
      <p>
        FastPromo provides automated digital top-ups delivered to the User ID
        and Zone ID you submit. Delivery times are typically seconds but are
        not guaranteed when supplier networks experience disruption.
      </p>

      <h2>3. Eligibility & account accuracy</h2>
      <p>
        You must be at least 18 (or the age of contractual capacity where you
        live). You must provide a correct in-game User ID and Zone ID. FastPromo
        is not responsible for diamonds delivered to an incorrect ID that you
        entered.
      </p>

      <h2>4. Payments</h2>
      <p>
        Prices are displayed in euros (EUR). Payments are processed by Stripe.
        Orders are only fulfilled after successful payment authorization.
      </p>

      <h2>5. Digital content & withdrawal</h2>
      <p>
        The Service is digital content. Under EU consumer rules, the 14-day
        right of withdrawal does not apply once performance has begun with your
        prior express consent and your acknowledgement that you lose that right.
        At checkout you confirm:
      </p>
      <ul>
        <li>you want delivery to start immediately after payment; and</li>
        <li>
          you understand you lose the withdrawal right once delivery begins.
        </li>
      </ul>
      <p>
        If payment succeeds but fulfillment fails, contact support with your
        Stripe session ID for resolution (re-delivery or refund as appropriate).
      </p>

      <h2>6. Refunds</h2>
      <p>
        Because digital goods are delivered instantly after consent, refunds are
        generally unavailable once fulfillment succeeds. Failed fulfillments
        after payment are handled via Discord or the support email in the
        footer.
      </p>

      <h2>7. Prohibited use</h2>
      <p>
        You may not abuse the platform, attempt fraud, reverse-engineer our
        APIs, or use the Services for unlawful purposes.
      </p>

      <h2>8. Affiliation</h2>
      <p>
        FastPromo is an independent reseller of digital top-ups. We are not
        affiliated with or endorsed by Moonton or any game publisher whose
        in-game currency we may deliver.
      </p>

      <h2>9. Accounts & purchase history</h2>
      <p>
        Creating an account is required to place orders. Your account stores
        order history, delivery details associated with each purchase, and
        cashback balances. You are responsible for keeping login credentials
        confidential.
      </p>

      <h2>10. Cashback rewards programme</h2>
      <p>
        FastPromo may award promotional cashback credit equal to a percentage of
        the amount paid (default 2%, configurable). Cashback is credited to your
        FastPromo wallet after a successful payment:
      </p>
      <ul>
        <li>is promotional store credit only — not legal tender;</li>
        <li>cannot be withdrawn, transferred, or sold;</li>
        <li>
          may be applied to future FastPromo top-ups at checkout, covering up to
          30% of the order total after any promo discount (the remainder is paid
          via Stripe; a small minimum card charge may apply);
        </li>
        <li>may be modified or discontinued with reasonable notice;</li>
        <li>has no cash surrender value.</li>
      </ul>

      <h2>11. Disputes</h2>
      <p>
        Contact support first. EU consumers may use the ODR platform:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>12. Contact</h2>
      <p>
        Support is available through our Discord community and by email (see the
        site footer). See also our <a href="/faq">FAQ</a> and{" "}
        <a href="/legal">Legal notice</a>.
      </p>
    </LegalShell>
  );
}
