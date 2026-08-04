"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { IdGuideModal } from "./IdGuideModal";
import { formatCents, getCashbackPercent, getCashbackWalletCoverPercent, calculateMaxCashbackRedeem } from "@/lib/cashback-config";
import { getStorePackages } from "@/lib/products";

export type Package = {
  id: string;
  label: string;
  diamonds: number | null;
  price: number;
  badge?: string;
  promoEligible?: boolean;
};

const PACKAGES: Package[] = getStorePackages();

function formatEuro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function TopUpFlow() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [useCashback, setUseCashback] = useState(true);
  const [consentAge, setConsentAge] = useState(false);
  const [consentDigital, setConsentDigital] = useState(false);
  const [consentIds, setConsentIds] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    partnerName: string;
    discountPercent: number;
    discountCents: number;
  } | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIdField = useId();
  const zoneIdField = useId();
  const promoField = useId();

  const isStep1Valid = userId.trim().length > 0 && zoneId.trim().length > 0;
  const isReady = isStep1Valid && selectedPackage !== null;
  const consentsOk = consentAge && consentDigital && consentIds;
  const cashbackCents = session?.user?.cashbackCents ?? 0;
  const cashbackPercent = getCashbackPercent();
  const walletCoverPercent = getCashbackWalletCoverPercent();
  const signedIn = status === "authenticated";

  const priceAfterPromoCents = selectedPackage
    ? Math.round(selectedPackage.price * 100) - (promoApplied?.discountCents ?? 0)
    : 0;
  const cashbackRedeemPreview =
    signedIn && useCashback && selectedPackage
      ? calculateMaxCashbackRedeem(priceAfterPromoCents, cashbackCents)
      : 0;

  async function applyPromoCode() {
    if (!signedIn) {
      window.location.href = `/login?next=${encodeURIComponent("/packages")}`;
      return;
    }
    if (!selectedPackage) {
      setPromoError("Select a package first to apply the promo.");
      return;
    }
    if (selectedPackage.promoEligible === false) {
      setPromoApplied(null);
      setPromoError(
        "Creator promos are not available on this package. Choose a larger pack to apply your code."
      );
      return;
    }
    if (!promoCode.trim()) {
      setPromoError("Enter a promo code.");
      return;
    }

    setPromoChecking(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: promoCode.trim(),
          productId: selectedPackage.id,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        partnerName?: string;
        discountPercent?: number;
        discountCents?: number;
      };

      if (!res.ok || !data.ok) {
        setPromoApplied(null);
        setPromoError(data.error ?? "Invalid promo code.");
        return;
      }

      setPromoApplied({
        code: data.code ?? promoCode.trim().toUpperCase(),
        partnerName: data.partnerName ?? "Partner",
        discountPercent: data.discountPercent ?? 0,
        discountCents: data.discountCents ?? 0,
      });
      setPromoError(null);
    } catch {
      setPromoError("Could not validate promo code.");
      setPromoApplied(null);
    } finally {
      setPromoChecking(false);
    }
  }

  async function handleCheckout() {
    if (!isReady || !selectedPackage) return;

    if (!signedIn) {
      window.location.href = `/login?next=${encodeURIComponent("/packages")}`;
      return;
    }

    if (!consentsOk) {
      setError("Please confirm age, digital delivery, and ID accuracy before paying.");
      return;
    }

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
          useCashback,
          promoCode: promoApplied?.code || undefined,
          consentAge: true,
          consentDigitalDelivery: true,
          consentIdsAccurate: true,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        redirectUrl?: string;
      };

      if (res.status === 401 || data.code === "AUTH_REQUIRED") {
        window.location.href = `/login?next=${encodeURIComponent("/packages")}`;
        return;
      }

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
      className="relative mx-auto max-w-6xl pb-40 pt-6 sm:pb-44 sm:pt-8"
      aria-label="Top-up flow"
    >
      {!signedIn && status !== "loading" && (
        <div className="mb-6 border border-[#FFD700]/25 bg-[#FFD700]/5 px-4 py-3 text-sm text-white/75">
          <Link href="/login?next=%2Fpackages" className="font-semibold text-[#FFD700] hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/register?next=%2Fpackages" className="font-semibold text-[#FFD700] hover:underline">
            create an account
          </Link>{" "}
          to checkout, track orders, and earn {cashbackPercent}% cashback to
          your FastPromo wallet (usable for up to {walletCoverPercent}% of a
          future order).
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
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
                <label htmlFor={userIdField} className="text-sm font-medium text-white/70">
                  User ID
                </label>
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:border-[#FFD700]/40 hover:text-[#FFD700]"
                  aria-label="How to find your User ID and Zone ID"
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
                className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12]/80 px-4 py-3.5 text-base text-white placeholder:text-white/30 transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor={zoneIdField} className="mb-2 block text-sm font-medium text-white/70">
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
                className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12]/80 px-4 py-3.5 text-base text-white placeholder:text-white/30 transition-all duration-300"
              />
            </div>

            <p className="text-xs leading-relaxed text-white/40">
              Open your in-game profile — your User ID and Zone ID appear under your nickname.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700] text-sm font-bold text-[#0d0f12]"
              aria-hidden="true"
            >
              2
            </span>
            <h2 className="text-lg font-semibold tracking-wide text-white sm:text-xl">
              Promo Code{" "}
              <span className="font-normal text-white/40">(optional)</span>
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor={promoField} className="mb-2 block text-sm font-medium text-white/70">
                Creator / partner code
              </label>
              <div className="flex gap-2">
                <input
                  id={promoField}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. STREAMER5"
                  value={promoCode}
                  disabled={selectedPackage?.promoEligible === false}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoApplied(null);
                    setPromoError(null);
                  }}
                  className="input-gold min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0d0f12]/80 px-4 py-3.5 text-base tracking-wide text-white placeholder:text-white/30 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={applyPromoCode}
                  disabled={
                    promoChecking ||
                    !promoCode.trim() ||
                    selectedPackage?.promoEligible === false
                  }
                  className="min-h-11 shrink-0 rounded-xl border border-[#FFD700]/40 px-4 py-3 text-sm font-semibold text-[#FFD700] transition hover:bg-[#FFD700]/10 disabled:opacity-50"
                >
                  {promoChecking ? "…" : "Apply"}
                </button>
              </div>
            </div>

            {promoApplied && (
              <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-200/90 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {promoApplied.code} · {promoApplied.discountPercent}% off
                  {promoApplied.partnerName ? ` via ${promoApplied.partnerName}` : ""}{" "}
                  (−{formatCents(promoApplied.discountCents)})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPromoApplied(null);
                    setPromoCode("");
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm text-white/50 underline-offset-2 hover:text-white/80 hover:underline sm:min-h-0 sm:py-1"
                >
                  Remove
                </button>
              </div>
            )}

            {promoError && (
              <p className="text-sm text-red-400" role="alert">
                {promoError}
              </p>
            )}

            <p className="text-xs leading-relaxed text-white/40">
              Optional. Valid creator codes unlock a one-time{" "}
              <span className="text-white/60">5% discount</span> on promo-eligible
              packs (706 Diamonds and above, plus Twilight Pass). Entry packs are
              excluded.
            </p>

            {signedIn && cashbackCents > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={useCashback}
                    onChange={(e) => setUseCashback(e.target.checked)}
                    className="mt-1 accent-[#FFD700]"
                  />
                  <span>
                    Apply FastPromo wallet balance (
                    {formatCents(cashbackCents)}) to this order
                  </span>
                </label>
                <p className="pl-7 text-xs leading-relaxed text-white/40">
                  Wallet credit covers up to{" "}
                  <span className="text-white/60">{walletCoverPercent}%</span> of
                  the order total after any promo.{" "}
                  {selectedPackage && useCashback ? (
                    <>
                      This order: up to{" "}
                      <span className="text-[#FFD700]/80">
                        {formatCents(cashbackRedeemPreview)}
                      </span>
                      .
                    </>
                  ) : (
                    <>Select a package to see how much applies.</>
                  )}
                </p>
              </div>
            )}

            {signedIn && cashbackCents === 0 && (
              <p className="border-t border-white/10 pt-4 text-xs leading-relaxed text-white/40">
                Earn <span className="text-white/60">{cashbackPercent}%</span>{" "}
                cashback on every paid order — credited to your FastPromo wallet.
                Wallet credit can cover up to{" "}
                <span className="text-white/60">{walletCoverPercent}%</span> of
                your next top-up.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 sm:mt-8 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700] text-sm font-bold text-[#0d0f12]"
            aria-hidden="true"
          >
            3
          </span>
          <h2 className="text-lg font-semibold tracking-wide text-white sm:text-xl">
            Select Package
          </h2>
        </div>

        <div
          className="package-scroll max-h-[22rem] overflow-y-auto overscroll-contain pr-1 sm:max-h-[28rem] lg:max-h-none lg:overflow-visible lg:pr-0"
          role="radiogroup"
          aria-label="Diamond packages"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 lg:gap-4">
            {PACKAGES.map((pkg) => {
              const selected = selectedPackage?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setPromoApplied(null);
                    if (pkg.promoEligible === false) {
                      setPromoError(
                        "Creator promos are not available on this package. Choose a larger pack to apply your code."
                      );
                    } else {
                      setPromoError(null);
                    }
                  }}
                  className={`relative flex min-h-[5.5rem] flex-col items-start rounded-xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-3 text-left transition-all duration-300 hover:border-[#FFD700]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] sm:min-h-0 sm:p-4 ${
                    selected
                      ? "package-selected border-[#FFD700]"
                      : "border-white/10"
                  }`}
                >
                  {pkg.badge && (
                    <span className="mb-1.5 rounded-md bg-[#FFD700] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d0f12]">
                      {pkg.badge}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm font-bold leading-snug text-white sm:text-base">
                    {pkg.diamonds != null && (
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        className="h-4 w-4 shrink-0 text-[#FFD700] sm:h-[1.125rem] sm:w-[1.125rem]"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2.2 3.8 9.5 12 21.8l8.2-12.3L12 2.2Zm0 2.7 5.2 4.6H6.8L12 4.9Zm-5.7 6.2h11.4L12 19.1 6.3 11.1Z"
                        />
                      </svg>
                    )}
                    {pkg.label}
                  </span>
                  <span className="mt-auto pt-2 text-base font-semibold text-[#FFD700] sm:text-lg">
                    {formatEuro(pkg.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-xs text-white/35 lg:hidden">
          Scroll to see all {PACKAGES.length} packages.
        </p>
        <p className="mt-3 hidden text-xs text-white/35 lg:block">
          {PACKAGES.length} packages · priced under typical in-game EUR tiers.
        </p>

        <fieldset className="mt-6 space-y-3 border-t border-white/10 pt-5">
          <legend className="text-sm font-semibold text-white/80">
            Before you pay
          </legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={consentAge}
              onChange={(e) => setConsentAge(e.target.checked)}
              className="mt-1 accent-[#FFD700]"
            />
            <span>I am at least 18 years old (or the age of contract capacity where I live).</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={consentDigital}
              onChange={(e) => setConsentDigital(e.target.checked)}
              className="mt-1 accent-[#FFD700]"
            />
            <span>
              I want digital delivery to start immediately after payment and I
              acknowledge I lose the 14-day withdrawal right once delivery
              begins (
              <Link href="/terms" className="text-[#FFD700] hover:underline">
                Terms
              </Link>
              ).
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={consentIds}
              onChange={(e) => setConsentIds(e.target.checked)}
              className="mt-1 accent-[#FFD700]"
            />
            <span>
              I confirm my User ID and Zone ID are correct. Wrong IDs cannot
              be reversed after delivery.
            </span>
          </label>
        </fieldset>
      </div>

      {isReady && selectedPackage && (
        <div
          className="checkout-bar-enter fixed inset-x-0 bottom-0 z-40 border-t border-[#FFD700]/20 bg-[#0d0f12]/95 backdrop-blur-xl"
          role="region"
          aria-label="Checkout summary"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm text-white/60">
                Deliver to ID <span className="font-medium text-white">{userId.trim()}</span>{" "}
                <span className="text-white/40">({zoneId.trim()})</span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#FFD700]">
                {selectedPackage.label} — {formatEuro(selectedPackage.price)}
                {promoApplied
                  ? ` · promo −${formatCents(promoApplied.discountCents)}`
                  : ""}
                {cashbackRedeemPreview > 0
                  ? ` · wallet −${formatCents(cashbackRedeemPreview)}`
                  : ""}
                {signedIn
                  ? ` · earn ${cashbackPercent}% to wallet`
                  : ""}
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
              disabled={isSubmitting || (signedIn && !consentsOk)}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#FFD700] px-6 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting
                ? "Processing…"
                : !signedIn
                  ? "Sign in to Pay"
                  : !consentsOk
                    ? "Confirm checkboxes above"
                    : "Proceed to Secure Payment"}
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
