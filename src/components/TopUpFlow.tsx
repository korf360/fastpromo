"use client";

import { useId, useState } from "react";
import { IdGuideModal } from "./IdGuideModal";

export type Package = {
  id: string;
  label: string;
  diamonds: number | null;
  price: number;
  badge?: string;
};

/** Display catalog — prices must match server PRODUCT_CATALOG cents. */
const PACKAGES: Package[] = [
  { id: "mlbb_50_diamonds", label: "50 Diamonds", diamonds: 50, price: 0.99 },
  { id: "mlbb_250_diamonds", label: "250 Diamonds", diamonds: 250, price: 4.49 },
  { id: "mlbb_500_diamonds", label: "500 Diamonds", diamonds: 500, price: 8.99 },
  {
    id: "mlbb_weekly_pass",
    label: "Weekly Diamond Pass",
    diamonds: null,
    price: 2.49,
    badge: "Best Value",
  },
];

function formatEuro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function TopUpFlow() {
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIdField = useId();
  const zoneIdField = useId();

  const isStep1Valid =
    userId.trim().length > 0 && zoneId.trim().length > 0;
  const isReady = isStep1Valid && selectedPackage !== null;

  async function handleCheckout() {
    if (!isReady || !selectedPackage) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          zoneId: zoneId.trim(),
          productId: selectedPackage.id,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirectUrl?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed. Please try again.");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      throw new Error("Checkout session created but no redirect URL was returned.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="relative mx-auto max-w-6xl pb-36 pt-8 sm:pb-40"
      aria-label="Top-up flow"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* STEP 1 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700] text-sm font-bold text-[#0d0f12]"
              aria-hidden="true"
            >
              1
            </span>
            <h2 className="text-lg font-semibold tracking-wide text-white sm:text-xl">
              Player Identification
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor={userIdField}
                  className="text-sm font-medium text-white/70"
                >
                  User ID
                </label>
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:border-[#FFD700]/40 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  aria-label="How to find your User ID and Zone ID"
                  title="Where to find your IDs"
                >
                  <HelpIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                id={userIdField}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 123456789"
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
                className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12]/80 px-4 py-3 text-white placeholder:text-white/30 transition-all duration-300"
              />
            </div>

            <div>
              <label
                htmlFor={zoneIdField}
                className="mb-2 block text-sm font-medium text-white/70"
              >
                Zone ID
              </label>
              <input
                id={zoneIdField}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 2345"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value.replace(/\D/g, ""))}
                className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12]/80 px-4 py-3 text-white placeholder:text-white/30 transition-all duration-300"
              />
            </div>

            <p className="text-xs leading-relaxed text-white/40">
              Open your MLBB profile — your User ID and Zone ID appear under
              your nickname. Tap the help icon for a visual guide.
            </p>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700] text-sm font-bold text-[#0d0f12]"
              aria-hidden="true"
            >
              2
            </span>
            <h2 className="text-lg font-semibold tracking-wide text-white sm:text-xl">
              Select Package
            </h2>
          </div>

          <div
            className="grid grid-cols-2 gap-3 sm:gap-4"
            role="radiogroup"
            aria-label="Diamond packages"
          >
            {PACKAGES.map((pkg) => {
              const selected = selectedPackage?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative flex flex-col items-start rounded-xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 text-left transition-all duration-300 hover:border-[#FFD700]/40 hover:from-white/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
                    selected
                      ? "package-selected border-[#FFD700]"
                      : "border-white/10"
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -right-1 -top-2 rounded-md bg-[#FFD700] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d0f12]">
                      {pkg.badge}
                    </span>
                  )}
                  <DiamondIcon className="mb-3 h-6 w-6 text-[#FFD700]" />
                  <span className="text-sm font-bold text-white sm:text-base">
                    {pkg.label}
                  </span>
                  <span className="mt-2 text-lg font-semibold text-[#FFD700]">
                    {formatEuro(pkg.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating checkout bar */}
      {isReady && selectedPackage && (
        <div
          className="checkout-bar-enter fixed inset-x-0 bottom-0 z-40 border-t border-[#FFD700]/20 bg-[#0d0f12]/95 backdrop-blur-xl"
          role="region"
          aria-label="Checkout summary"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm text-white/60">
                Deliver to ID{" "}
                <span className="font-medium text-white">
                  {userId.trim()}
                </span>{" "}
                <span className="text-white/40">({zoneId.trim()})</span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#FFD700]">
                {selectedPackage.label} — {formatEuro(selectedPackage.price)}
              </p>
              {error && (
                <p className="mt-1 text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#FFD700] px-6 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Processing…" : "Proceed to Secure Payment"}
            </button>
          </div>
        </div>
      )}

      <IdGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2L2 9l10 13L22 9 12 2zm0 2.5L18.5 9 12 17.5 5.5 9 12 4.5z" />
      <path d="M5.5 9h13L12 17.5 5.5 9z" opacity="0.4" />
    </svg>
  );
}
