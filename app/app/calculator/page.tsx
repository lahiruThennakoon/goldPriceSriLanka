"use client";

import { useMemo, useState } from "react";
import { useMarketData } from "@/lib/use-market-data";
import {
  formatGrams,
  formatLkr,
  formatPavan,
  goldValueLkr,
  gramsToPavan,
  pavanToGrams,
} from "@/lib/gold-math";
import { getSettings } from "@/lib/storage";

const PURITY_OPTIONS = [24, 22, 21, 18, 14] as const;

export default function CalculatorPage() {
  const { response, loading } = useMarketData();
  const settings = useMemo(() => getSettings(), []);
  const [unit, setUnit] = useState<"grams" | "pavan">(settings.defaultWeightUnit);
  const [weightInput, setWeightInput] = useState("8");
  const [purity, setPurity] = useState<number>(settings.defaultPurity);
  const [customPurity, setCustomPurity] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const weight = parseFloat(weightInput) || 0;
  const weightGrams = unit === "grams" ? weight : pavanToGrams(weight);
  const effectivePurity = isCustom ? parseFloat(customPurity) || 0 : purity;

  if (loading) {
    return (
      <main className="mx-auto max-w-md p-4">
        <div className="h-64 animate-pulse rounded-md bg-surface-raised" />
      </main>
    );
  }

  if (!response?.data) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-sm" style={{ color: "var(--negative)" }}>
          Price unavailable right now — the calculator needs a live or cached rate to work.
        </p>
      </main>
    );
  }

  const { data } = response;
  const value =
    weightGrams > 0 && effectivePurity > 0
      ? goldValueLkr(data.goldUsdPerTroyOunce, data.usdLkrRate, effectivePurity, weightGrams)
      : 0;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-lg font-semibold">Gold Calculator</h1>

      <div className="rounded-md bg-surface-raised p-4">
        <label className="text-xs" style={{ color: "var(--ink-secondary)" }}>
          Weight
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="min-h-[44px] flex-1 rounded-sm border border-border-hairline bg-transparent px-3 py-2 tabular-nums"
            aria-label="Weight"
          />
          <div className="flex overflow-hidden rounded-sm border border-border-hairline">
            {(["grams", "pavan"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className="min-h-[44px] min-w-[44px] px-3 text-sm"
                style={{
                  background: unit === u ? "var(--accent-gold)" : "transparent",
                  color: unit === u ? "var(--surface-base)" : "var(--ink-primary)",
                }}
                aria-pressed={unit === u}
              >
                {u === "grams" ? "g" : "pavan"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md bg-surface-raised p-4">
        <label className="text-xs" style={{ color: "var(--ink-secondary)" }}>
          Purity
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          {PURITY_OPTIONS.map((k) => (
            <button
              key={k}
              onClick={() => {
                setIsCustom(false);
                setPurity(k);
              }}
              className="min-h-[44px] rounded-sm border border-border-hairline px-4 text-sm"
              style={{
                background: !isCustom && purity === k ? "var(--accent-gold)" : "transparent",
                color: !isCustom && purity === k ? "var(--surface-base)" : "var(--ink-primary)",
              }}
              aria-pressed={!isCustom && purity === k}
            >
              {k}K
            </button>
          ))}
          <button
            onClick={() => setIsCustom(true)}
            className="min-h-[44px] rounded-sm border border-border-hairline px-4 text-sm"
            style={{
              background: isCustom ? "var(--accent-gold)" : "transparent",
              color: isCustom ? "var(--surface-base)" : "var(--ink-primary)",
            }}
            aria-pressed={isCustom}
          >
            Custom
          </button>
        </div>
        {isCustom && (
          <input
            type="number"
            min={1}
            max={24}
            value={customPurity}
            onChange={(e) => setCustomPurity(e.target.value)}
            placeholder="1–24"
            className="mt-2 min-h-[44px] w-full rounded-sm border border-border-hairline bg-transparent px-3 py-2 tabular-nums"
            aria-label="Custom purity karat"
          />
        )}
      </div>

      <div className="rounded-md bg-surface-raised p-5">
        <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
          {formatGrams(weightGrams)} &middot; {formatPavan(gramsToPavan(weightGrams))} &middot; {effectivePurity || "—"}K
        </p>
        <p className="tabular-nums mt-2 text-4xl font-semibold" style={{ color: "var(--accent-gold)" }}>
          {formatLkr(value)}
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--ink-secondary)" }}>
          Estimated value only — not an actual buy/sell quote from any jeweller.
        </p>
      </div>
    </main>
  );
}
