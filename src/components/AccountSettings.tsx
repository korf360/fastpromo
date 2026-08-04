"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialName: string;
  email: string;
};

export function AccountSettings({ initialName, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    setProfileError(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setProfileError(data.error ?? "Could not update profile.");
        return;
      }
      setProfileMsg("Display name saved.");
      router.refresh();
    } catch {
      setProfileError("Could not update profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setPasswordError(data.error ?? "Could not change password.");
        return;
      }
      setPasswordMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Could not change password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={saveProfile}
        className="space-y-4 border border-white/10 bg-white/[0.02] p-5"
      >
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Profile
          </h3>
          <p className="mt-1 text-xs text-white/35">
            How your name appears on this account
          </p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/45">Email</span>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-base text-white/45"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/45">Display name</span>
          <input
            type="text"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-3 text-base text-white placeholder:text-white/25"
          />
        </label>
        {profileError && (
          <p className="text-sm text-red-400" role="alert">
            {profileError}
          </p>
        )}
        {profileMsg && (
          <p className="text-sm text-emerald-300" role="status">
            {profileMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={profileLoading}
          className="min-h-11 rounded-lg bg-[#FFD700] px-4 py-3 text-sm font-bold text-[#0d0f12] transition hover:brightness-110 disabled:opacity-60"
        >
          {profileLoading ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form
        onSubmit={changePassword}
        className="space-y-4 border border-white/10 bg-white/[0.02] p-5"
      >
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Security
          </h3>
          <p className="mt-1 text-xs text-white/35">
            Change your password (minimum 8 characters)
          </p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/45">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-3 text-base text-white"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/45">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-3 text-base text-white"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/45">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-gold w-full rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-3 text-base text-white"
          />
        </label>
        {passwordError && (
          <p className="text-sm text-red-400" role="alert">
            {passwordError}
          </p>
        )}
        {passwordMsg && (
          <p className="text-sm text-emerald-300" role="status">
            {passwordMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={passwordLoading}
          className="min-h-11 rounded-lg border border-white/15 px-4 py-3 text-sm font-medium text-white/85 transition hover:border-white/30 disabled:opacity-60"
        >
          {passwordLoading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-200",
    paid: "bg-sky-500/15 text-sky-200",
    fulfilled: "bg-emerald-500/15 text-emerald-300",
    failed: "bg-red-500/15 text-red-300",
  };
  const labels: Record<string, string> = {
    pending: "Awaiting payment",
    paid: "Delivering",
    fulfilled: "Delivered",
    failed: "Failed",
  };

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-white/10 text-white/60"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

/** Visual pipeline: Paid → Delivering → Delivered (or Failed). */
export function OrderStatusTrack({ status }: { status: string }) {
  if (status === "failed") {
    return (
      <p className="mt-2 text-xs text-red-300/90">
        Payment or delivery failed. Contact Discord support with your receipt.
      </p>
    );
  }

  if (status === "pending") {
    return (
      <p className="mt-2 text-xs text-amber-200/80">
        Waiting for Stripe payment confirmation.
      </p>
    );
  }

  const steps = [
    { key: "paid", label: "Paid" },
    { key: "delivering", label: "Delivering" },
    { key: "fulfilled", label: "Delivered" },
  ] as const;

  const activeIndex =
    status === "fulfilled" ? 2 : status === "paid" ? 1 : 0;

  return (
    <ol className="mt-3 flex items-center gap-1.5" aria-label="Order progress">
      {steps.map((step, i) => {
        const done = i <= activeIndex;
        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`h-1.5 flex-1 rounded-full ${
                done ? "bg-[#FFD700]" : "bg-white/10"
              }`}
              aria-hidden
            />
            <span
              className={`shrink-0 text-[10px] font-medium uppercase tracking-wide ${
                done ? "text-[#FFD700]/90" : "text-white/30"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
