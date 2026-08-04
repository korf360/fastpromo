"use client";

import { useEffect, useState } from "react";

type HealthState = "loading" | "ok" | "down";

export function StatusHealthClient() {
  const [state, setState] = useState<HealthState>("loading");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          setState("ok");
          setCheckedAt(new Date().toISOString());
        } else {
          setState("down");
        }
      } catch {
        if (!cancelled) setState("down");
      }
    }

    void ping();
    const id = window.setInterval(ping, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label =
    state === "loading"
      ? "Checking…"
      : state === "ok"
        ? "Operational"
        : "Degraded / unreachable";

  const tone =
    state === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : state === "down"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-white/10 bg-white/[0.03] text-white/55";

  return (
    <div className={`mt-8 border px-5 py-4 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
            Website
          </p>
          <p className="mt-1 text-base font-semibold">{label}</p>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            state === "ok"
              ? "bg-emerald-400"
              : state === "down"
                ? "bg-red-400"
                : "bg-white/30"
          }`}
          aria-hidden
        />
      </div>
      {checkedAt && (
        <p className="mt-2 text-xs opacity-70">
          Last check: {new Date(checkedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
