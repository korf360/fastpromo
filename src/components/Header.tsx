"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrandMark } from "./BrandMark";
import { HeaderAuth } from "./HeaderAuth";

const NAV = [
  { href: "/packages", label: "Top-Up" },
  { href: "/faq", label: "FAQ" },
  { href: "/status", label: "Status" },
  { href: "/#support", label: "Support" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  const authHref = session?.user ? "/account" : "/login";
  const authLabel = session?.user ? "Account" : "Sign in";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0d0f12]/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          <BrandMark />

          <nav
            className="hidden items-center gap-6 lg:flex"
            aria-label="Primary"
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-white/55 transition-all duration-300 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block">
              <HeaderAuth />
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-white/80 transition-colors hover:border-[#FFD700]/40 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] lg:hidden"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span aria-hidden="true" className="relative block h-3.5 w-4">
                <span
                  className={`absolute left-0 top-0 block h-0.5 w-4 bg-current transition-transform duration-200 ${
                    open ? "translate-y-[6px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[6px] block h-0.5 w-4 bg-current transition-opacity duration-200 ${
                    open ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[12px] block h-0.5 w-4 bg-current transition-transform duration-200 ${
                    open ? "-translate-y-[6px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={`border-t border-white/5 bg-[#0d0f12] lg:hidden ${
            open ? "block" : "hidden"
          }`}
        >
          <nav
            className="mx-auto flex max-h-[min(70dvh,28rem)] max-w-6xl flex-col gap-1 overflow-y-auto px-4 py-4 sm:px-6"
            aria-label="Mobile"
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="rounded-lg px-3 py-3.5 text-base text-white/75 transition-colors hover:bg-white/5 hover:text-[#FFD700]"
              >
                {item.label}
              </a>
            ))}
            {status !== "loading" && (
              <Link
                href={authHref}
                onClick={close}
                className="mt-1 min-h-11 rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/10 px-3 py-3.5 text-base font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/20"
              >
                {authLabel}
              </Link>
            )}
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                onClick={close}
                className="rounded-lg px-3 py-3.5 text-base text-white/75 transition-colors hover:bg-white/5 hover:text-[#FFD700]"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          aria-label="Close menu overlay"
          onClick={close}
        />
      )}
    </>
  );
}
