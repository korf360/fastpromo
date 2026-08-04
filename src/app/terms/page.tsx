import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { getMerchantProfile } from "@/lib/receipt";
import { DISCORD_SUPPORT_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "FastPromo terms for diamond top-ups: eligibility, delivery, withdrawal waiver for digital content, refunds, and support.",
};

export default function TermsPage() {
  const merchant = getMerchantProfile();

  return (
    <LegalShell title="Terms of Service" updated="4 August 2026">
      <p>
        These Terms govern your use of the {merchant.brandName} website and
        diamond top-up services (“Services”). By placing an order you agree to
        these Terms.
      </p>

      <h2>1. Pilot / limited launch</h2>
      <p>
        FastPromo may operate as a limited pilot while the operator validates
        the service. During the pilot, payment confirmations may not yet
        constitute a full fiscal invoice. See the{" "}
        <a href="/legal">Legal notice</a> for current operator contact details.
      </p>

      <h2>2. Service description & delivery</h2>
      <p>
        FastPromo provides automated digital top-ups delivered to the User ID
        and Zone ID you submit. After Stripe confirms payment:
      </p>
      <ul>
        <li>
          <strong>Typical delivery:</strong> within a few seconds under normal
          conditions;
        </li>
        <li>
          <strong>Occasional delays:</strong> supplier queues, game-side issues,
          or maintenance can extend delivery beyond a few minutes;
        </li>
        <li>
          Delivery times are <strong>targets, not hard guarantees</strong>, when
          third-party networks are disrupted.
        </li>
      </ul>
      <p>
        Live operational notes may also appear on our{" "}
        <a href="/status">Status</a> page and Discord status channels.
      </p>

      <h2>3. Eligibility & account accuracy</h2>
      <p>
        You must be at least 18 (or the age of contractual capacity where you
        live). You must provide a correct in-game User ID and Zone ID. FastPromo
        is not responsible for diamonds delivered to an incorrect ID that you
        entered. Wrong IDs generally cannot be reversed after successful
        delivery.
      </p>

      <h2>4. Payments</h2>
      <p>
        Prices are displayed in euros (EUR). Payments are processed by Stripe.
        Orders are only fulfilled after successful payment authorization. Taxes
        (including VAT) may apply according to your country of residence and
        applicable digital-services rules; displayed prices are as shown at
        checkout unless stated otherwise.
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

      <h2>6. Refunds & failed fulfillment</h2>
      <ul>
        <li>
          <strong>Successful delivery</strong> to the IDs you provided: refunds
          are generally unavailable (digital content consumed).
        </li>
        <li>
          <strong>Payment succeeded but fulfillment failed</strong> (no delivery
          after a reasonable wait): contact support with your Stripe session ID.
          We will investigate and, as appropriate, re-attempt delivery or refund
          the paid amount.
        </li>
        <li>
          <strong>Wrong ID entered by you:</strong> we cannot usually recover
          diamonds from another account; prevention (double-check before pay) is
          required.
        </li>
        <li>
          Chargebacks filed without first contacting support may delay
          resolution; please reach out first with your session ID.
        </li>
      </ul>

      <h2>7. Support</h2>
      <p>
        Primary support is via Discord (
        <a href={DISCORD_SUPPORT_URL}>{DISCORD_SUPPORT_URL.replace("https://", "")}</a>
        ) and email{" "}
        <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>.
        We aim to respond to tickets with a valid order reference as soon as
        reasonably possible during active support coverage. Response times are
        not contractual SLAs.
      </p>

      <h2>8. Prohibited use</h2>
      <p>
        You may not abuse the platform, attempt fraud, reverse-engineer our
        APIs, or use the Services for unlawful purposes.
      </p>

      <h2>9. Affiliation</h2>
      <p>
        FastPromo is an independent reseller of digital top-ups. We are not
        affiliated with or endorsed by Moonton or any game publisher whose
        in-game currency we may deliver.
      </p>

      <h2>10. Accounts & purchase history</h2>
      <p>
        Creating an account is required to place orders. Your account stores
        order history, delivery details associated with each purchase, and
        cashback balances. You are responsible for keeping login credentials
        confidential.
      </p>

      <h2>11. Cashback rewards programme</h2>
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

      <h2>12. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by applicable consumer law, FastPromo is
        not liable for delays or failures caused by third-party payment
        processors, fulfillment suppliers, hosting providers, or the game
        publisher’s systems. Nothing in these Terms limits liability that cannot
        be limited under mandatory EU / national consumer protection rules.
      </p>

      <h2>13. Disputes</h2>
      <p>
        Contact support first. EU consumers may use the European Commission’s
        Online Dispute Resolution platform:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>14. Contact</h2>
      <p>
        Support:{" "}
        <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>{" "}
        · Discord · <a href="/faq">FAQ</a> · <a href="/status">Status</a> ·{" "}
        <a href="/legal">Legal notice</a>.
      </p>
    </LegalShell>
  );
}
