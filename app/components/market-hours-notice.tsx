"use client";

import { useEffect, useState } from "react";
import { isWeekendMarketClosed, weekendMarketClosedCopy } from "@/lib/market-hours";

export function MarketHoursNotice({ className = "" }: { className?: string }) {
  const [closed, setClosed] = useState(() => isWeekendMarketClosed());

  useEffect(() => {
    const refresh = () => setClosed(isWeekendMarketClosed());
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!closed) return null;

  const copy = weekendMarketClosedCopy();

  return (
    <div
      className={`rounded-sm border px-3 py-2.5 text-xs leading-relaxed ${className}`}
      style={{
        borderColor: "color-mix(in srgb, var(--verify-amber) 35%, transparent)",
        background: "color-mix(in srgb, var(--verify-amber) 10%, var(--surface-base))",
        color: "var(--ink-secondary)",
      }}
      role="status"
    >
      <p className="font-medium" style={{ color: "var(--verify-amber)" }}>
        {copy.title}
      </p>
      <p className="mt-1">{copy.detail}</p>
    </div>
  );
}
