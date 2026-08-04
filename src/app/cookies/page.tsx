import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { getMerchantProfile } from "@/lib/receipt";
import {
  CONSENT_STORAGE_KEY,
  PILOT_BANNER_STORAGE_KEY,
} from "@/lib/cookie-consent";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How FastPromo uses essential cookies and local storage for EU visitors. No analytics or advertising cookies at this time.",
};

export default function CookiesPage() {
  const merchant = getMerchantProfile();

  return (
    <LegalShell title="Cookie Policy" updated="4 August 2026">
      <p>
        This Cookie Policy explains how {merchant.brandName} (“we”, “us”) uses
        cookies and similar technologies on our website. It should be read with
        our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What are cookies and similar technologies?</h2>
      <p>
        Cookies are small text files stored on your device by a website. We also
        use browser <strong>local storage</strong> for the same kinds of
        essential purposes (for example remembering that you dismissed a notice
        or saved cookie preferences). In this policy, “cookies” includes those
        similar technologies where relevant.
      </p>

      <h2>2. How we use cookies</h2>
      <p>
        Under the EU ePrivacy rules and GDPR, cookies that are{" "}
        <strong>strictly necessary</strong> to provide a service you request do
        not require prior consent. Optional cookies (analytics, advertising)
        require consent before they are set.
      </p>
      <p>
        <strong>
          FastPromo currently uses only essential cookies and local storage.
        </strong>{" "}
        We do <strong>not</strong> set analytics, advertising, or social-media
        tracking cookies on our domain at this time.
      </p>

      <h2>3. Cookie and storage inventory</h2>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Provider</th>
              <th scope="col">Purpose</th>
              <th scope="col">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>authjs.session-token</code> /{" "}
                <code>__Secure-authjs.session-token</code>
              </td>
              <td>Essential cookie</td>
              <td>{merchant.brandName} (Auth.js)</td>
              <td>Keeps you signed in to your account</td>
              <td>Session / until sign-out (JWT session)</td>
            </tr>
            <tr>
              <td>
                <code>authjs.csrf-token</code> /{" "}
                <code>__Host-authjs.csrf-token</code>
              </td>
              <td>Essential cookie</td>
              <td>{merchant.brandName} (Auth.js)</td>
              <td>Protects login and account actions against CSRF</td>
              <td>Session</td>
            </tr>
            <tr>
              <td>
                <code>authjs.callback-url</code>
              </td>
              <td>Essential cookie</td>
              <td>{merchant.brandName} (Auth.js)</td>
              <td>Returns you to the correct page after sign-in / OAuth</td>
              <td>Session</td>
            </tr>
            <tr>
              <td>
                <code>{CONSENT_STORAGE_KEY}</code>
              </td>
              <td>Essential local storage</td>
              <td>{merchant.brandName}</td>
              <td>Stores your cookie notice acknowledgement / preferences</td>
              <td>Until you clear site data</td>
            </tr>
            <tr>
              <td>
                <code>{PILOT_BANNER_STORAGE_KEY}</code>
              </td>
              <td>Essential local storage</td>
              <td>{merchant.brandName}</td>
              <td>Remembers that you dismissed the pilot notice</td>
              <td>Until you clear site data</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Exact Auth.js cookie names may include a <code>__Secure-</code> or{" "}
        <code>__Host-</code> prefix when the site is served over HTTPS.
      </p>

      <h2>4. Third-party services (other domains)</h2>
      <p>
        When you start a payment, you are redirected to{" "}
        <strong>Stripe Checkout</strong> (Stripe, Inc. / Stripe Payments Europe).
        Stripe may set its own cookies on Stripe-controlled domains under
        Stripe’s policies. We do not control those cookies.
      </p>
      <p>
        If you choose <strong>Google sign-in</strong>, Google may set cookies on
        Google-controlled domains as part of authentication. See Google’s
        privacy documentation for details.
      </p>
      <p>
        Our site is typically hosted on infrastructure providers (for example
        Vercel). Those providers may process technical connection data as
        described in our Privacy Policy; they are not used here as advertising
        trackers.
      </p>

      <h2>5. Managing preferences</h2>
      <p>
        Use the cookie notice on first visit, or open{" "}
        <button
          type="button"
          data-open-cookie-settings
          className="text-[#FFD700] underline-offset-2 hover:underline"
        >
          Cookie settings
        </button>{" "}
        from the footer at any time. You can also delete cookies and site data
        in your browser settings. Blocking essential cookies may prevent
        sign-in or checkout from working.
      </p>

      <h2>6. Changes</h2>
      <p>
        If we introduce analytics or other optional cookies, we will update this
        policy, show a consent choice before those cookies are set, and only
        load them after you opt in.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about cookies or privacy:{" "}
        <a href={`mailto:${merchant.supportEmail}`}>{merchant.supportEmail}</a>
        . Operator details during the pilot are in our{" "}
        <a href="/legal">Legal notice</a>.
      </p>
    </LegalShell>
  );
}
