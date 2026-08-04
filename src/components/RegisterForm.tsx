"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("next") || "/account";
  const googleOn = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed.");
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (login?.error) {
      setError("Account created — please sign in.");
      router.push(`/login?next=${encodeURIComponent(callbackUrl)}`);
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
        Create account
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        Track purchases and earn 2% cashback to your FastPromo wallet on every
        top-up (usable for up to 30% of a future order). Already registered?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(callbackUrl)}`}
          className="text-[#FFD700] hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-8">
        <GoogleSignInButton callbackUrl={callbackUrl} />
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
          <label htmlFor="name" className="mb-2 block text-sm text-white/70">
            Display name <span className="text-white/35">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12] px-4 py-3.5 text-base text-white"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-gold w-full rounded-xl border border-white/10 bg-[#0d0f12] px-4 py-3.5 text-base text-white"
          />
          <p className="mt-1.5 text-xs text-white/40">
            At least 8 characters, including a letter and a number.
          </p>
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
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
