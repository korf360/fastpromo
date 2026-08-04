"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "fp_pilot_banner_dismissed_v1";

export function SoftLaunchBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="relative z-[45] border-b border-[#FFD700]/20 bg-[#151208] px-4 py-2.5 sm:px-6"
      role="status"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-white/70 sm:text-sm">
          <span className="font-semibold text-[#FFD700]">Limited pilot.</span>{" "}
          FastPromo is testing service quality before full commercial launch.
          Orders are real; receipts are payment confirmations.{" "}
          <Link href="/legal" className="text-[#FFD700] underline-offset-2 hover:underline">
            Legal notice
          </Link>
        </p>
        <button
          type="button"
          className="shrink-0 rounded px-2 py-1 text-xs text-white/45 transition-colors hover:text-white/80"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
          aria-label="Dismiss pilot notice"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
