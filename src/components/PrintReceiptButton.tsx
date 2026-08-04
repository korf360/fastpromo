"use client";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-[#FFD700] px-3.5 py-2 text-sm font-bold text-[#0d0f12] transition hover:brightness-110"
    >
      Print / Save PDF
    </button>
  );
}
