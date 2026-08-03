import { LegalShell } from "@/components/LegalShell";

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" updated="3 August 2026">
      <p>
        This Cookie Policy explains how FastPromo uses cookies and similar
        technologies on our website.
      </p>
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. They help websites
        function, remember preferences, and understand usage patterns.
      </p>
      <h2>2. Cookies we use</h2>
      <ul>
        <li>
          <strong>Essential</strong> — security, load balancing, consent
          storage, and checkout continuity. These cannot be disabled if you
          use the site.
        </li>
        <li>
          <strong>Analytics (optional)</strong> — help us understand which
          pages perform well. Only set if you accept analytics in the banner.
        </li>
      </ul>
      <h2>3. Managing preferences</h2>
      <p>
        Use the cookie banner on first visit, or open{" "}
        <button type="button" data-open-cookie-settings className="text-[#FFD700] underline-offset-2 hover:underline">
          Cookie settings
        </button>{" "}
        from the footer anytime. You can also clear cookies in your browser.
      </p>
      <h2>4. More information</h2>
      <p>
        For personal data processing beyond cookies, see our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalShell>
  );
}
