"use client";

import { useState } from "react";

export function CopySupportId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex max-w-full items-center gap-2 font-mono text-xs text-[#FFD700] transition hover:text-[#ffe44d]"
      title="Copy support ID for Discord"
      aria-label={`Copy support ID ${value}`}
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 text-[10px] tracking-wide text-white/40 uppercase group-hover:text-white/60">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
