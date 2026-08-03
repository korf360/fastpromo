const DISCORD_URL = "https://discord.gg/fastpromo";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#0a0c0f]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[#FFD700]">
              FastPromo
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
              Instant MLBB diamond top-ups for European players. Automated,
              secure, and built for speed.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/35">
              Platform
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="/#why" className="footer-link">
                  Why FastPromo
                </a>
              </li>
              <li>
                <a href="/#how" className="footer-link">
                  How it works
                </a>
              </li>
              <li>
                <a href="/#top-up" className="footer-link">
                  Top-Up
                </a>
              </li>
              <li>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Discord Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/35">
              Legal
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="/terms" className="footer-link">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="footer-link">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/cookies" className="footer-link">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/35">
              Compliance
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/45">
              GDPR-aligned processing. We only use data required to complete
              your order and secure payment.
            </p>
            <button
              type="button"
              className="footer-link mt-3"
              data-open-cookie-settings
            >
              Cookie settings
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/35">
            © 2026 FastPromo. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Not affiliated with Moonton / Mobile Legends: Bang Bang.
          </p>
        </div>
      </div>
    </footer>
  );
}
