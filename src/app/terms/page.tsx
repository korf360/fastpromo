import { LegalShell } from "@/components/LegalShell";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="3 August 2026">
      <p>
        These Terms govern your use of the FastPromo website and diamond top-up
        services for Mobile Legends: Bang Bang (“Services”). By placing an
        order you agree to these Terms.
      </p>
      <h2>1. Service description</h2>
      <p>
        FastPromo provides automated digital top-ups delivered to the User ID
        and Zone ID you submit. Delivery times are typically seconds but are
        not guaranteed when supplier networks experience disruption.
      </p>
      <h2>2. Eligibility & account accuracy</h2>
      <p>
        You must provide a correct MLBB User ID and Zone ID. FastPromo is not
        responsible for diamonds delivered to an incorrect ID that you entered.
        You must be legally able to make online purchases in your jurisdiction.
      </p>
      <h2>3. Payments</h2>
      <p>
        Prices are displayed in euros (EUR). Payments are processed by Stripe.
        Orders are only fulfilled after successful payment authorization.
      </p>
      <h2>4. Refunds</h2>
      <p>
        Because digital goods are delivered instantly, refunds are generally
        unavailable once fulfillment succeeds. If an order fails after payment,
        contact support via Discord with your Stripe session ID for resolution.
      </p>
      <h2>5. Prohibited use</h2>
      <p>
        You may not abuse the platform, attempt fraud, reverse-engineer our
        APIs, or use the Services for unlawful purposes.
      </p>
      <h2>6. Affiliation</h2>
      <p>
        FastPromo is an independent reseller of digital top-ups. We are not
        affiliated with or endorsed by Moonton or Mobile Legends: Bang Bang.
      </p>
      <h2>7. Contact</h2>
      <p>
        Support is available through our Discord community. For legal notices,
        use the contact channels published on the FastPromo Discord server.
      </p>
    </LegalShell>
  );
}
