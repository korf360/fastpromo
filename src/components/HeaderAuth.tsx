"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatCents } from "@/lib/cashback-config";

export function HeaderAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="hidden h-11 w-20 animate-pulse rounded-lg bg-white/5 sm:inline-block" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.isAdmin && (
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/10 px-3 py-2.5 text-sm font-semibold text-[#FFD700] transition-all duration-300 hover:bg-[#FFD700]/20"
          >
            Admin
          </Link>
        )}
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-[#FFD700]/40 hover:text-[#FFD700]"
        >
          <span className="hidden sm:inline">Account</span>
          {session.user.cashbackCents > 0 && (
            <span className="text-xs text-[#FFD700]">
              {formatCents(session.user.cashbackCents)}
            </span>
          )}
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex min-h-11 items-center px-3 py-2.5 text-sm font-medium text-white/70 transition-colors duration-300 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
    >
      Sign in
    </Link>
  );
}
