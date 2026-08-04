"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "./GoogleSignInButton";

type Props = {
  googleEnabled?: boolean;
};

export function LoginForm({ googleEnabled = false }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("next") || "/account";
  const googleOn = googleEnabled;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-24 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
        Account
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Sign in
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        Access your order history and FastPromo wallet. New here?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(callbackUrl)}`}
          className="text-[#FFD700] hover:underline"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-8">
        <GoogleSignInButton callbackUrl={callbackUrl} enabled={googleOn} />
      </div>

      {googleOn && (
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-white/35">
            or email
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className={googleOn ? "space-y-5" : "mt-8 space-y-5"}
      >
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-white/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12] px-4 py-3.5 text-base text-white"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-white/70">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12] px-4 py-3.5 text-base text-white"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full rounded-xl bg-[#FFD700] px-4 py-3.5 text-sm font-bold text-[#0d0f12] transition-all duration-300 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {process.env.NEXT_PUBLIC_DISCORD_LOGIN === "true" && (
        <button
          type="button"
          onClick={() => signIn("discord", { callbackUrl })}
          className="mt-3 min-h-11 w-full rounded-xl border border-[#5865F2]/50 bg-[#5865F2]/15 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5865F2]/30"
        >
          Continue with Discord
        </button>
      )}

      <p className="mt-6 text-xs leading-relaxed text-white/40">
        By signing in you agree to our{" "}
        <Link href="/terms" className="text-white/60 hover:text-[#FFD700]">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-white/60 hover:text-[#FFD700]">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
