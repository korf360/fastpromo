"use client";

import { useEffect, useRef } from "react";

type IdGuideModalProps = {
  open: boolean;
  onClose: () => void;
};

export function IdGuideModal({ open, onClose }: IdGuideModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="id-guide-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300"
        aria-label="Close guide"
        onClick={onClose}
      />

      <div className="modal-panel relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#14171c] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3
            id="id-guide-title"
            className="text-base font-semibold text-white"
          >
            Find your Player IDs
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-all duration-300 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <MlbbProfileGuide />
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/70">
            <li>Open the game and tap your avatar.</li>
            <li>
              Under your nickname, find{" "}
              <span className="text-[#FFD700]">User ID</span> (long number) and{" "}
              <span className="text-[#FFD700]">Zone ID</span> (after the
              parenthesis or server tag).
            </li>
            <li>Copy both numbers into Step 1 — no spaces needed.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/** Stylized in-game profile mock — shows where User ID / Zone ID appear */
function MlbbProfileGuide() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#1a2030] to-[#0d0f12] p-4"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700]/40 to-[#FFD700]/10 ring-2 ring-[#FFD700]/30">
          <span className="text-lg font-bold text-[#FFD700]">ML</span>
        </div>
        <div>
          <p className="font-semibold text-white">PlayerNickname</p>
          <p className="mt-0.5 font-mono text-xs text-white/50">
            <span className="rounded bg-[#FFD700]/15 px-1 text-[#FFD700]">
              123456789
            </span>
            <span className="text-white/30"> (</span>
            <span className="rounded bg-[#FFD700]/15 px-1 text-[#FFD700]">
              2345
            </span>
            <span className="text-white/30">)</span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-[10px]">
        <span className="rounded border border-[#FFD700]/40 bg-[#FFD700]/10 px-2 py-1 text-[#FFD700]">
          ← User ID
        </span>
        <span className="rounded border border-[#FFD700]/40 bg-[#FFD700]/10 px-2 py-1 text-[#FFD700]">
          Zone ID →
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-white/5 ring-1 ring-white/5"
          />
        ))}
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
