"use client";

import { useCallback, useState } from "react";
import { useMarketData } from "@/lib/use-market-data";
import { formatLkr, goldValueLkr } from "@/lib/gold-math";
import {
  deleteHolding,
  getDefaultPurityKarat,
  getHoldings,
  saveHolding,
  type Holding,
  type HoldingForm,
} from "@/lib/storage";
import { useStoreRefresh } from "@/lib/use-store-refresh";

const FORM_LABELS: Record<HoldingForm, string> = {
  biscuit: "Biscuit / Bar",
  bar: "Bar",
  coin: "Coin",
  other: "Other",
};

export default function MyGoldPage() {
  const { response, loading } = useMarketData();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refresh = useCallback(() => setHoldings(getHoldings()), []);
  useStoreRefresh(refresh);

  function handleDelete(id: string) {
    deleteHolding(id);
    refresh();
  }

  const stale = response && (response.status === "stale-cache" || response.status === "sample");

  const total =
    response?.data
      ? holdings.reduce(
          (sum, h) => sum + goldValueLkr(response.data!.goldUsdPerTroyOunce, response.data!.usdLkrRate, h.purityKarat, h.weightGrams),
          0
        )
      : 0;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-lg font-semibold">My Gold</h1>

      {stale && (
        <p className="text-xs" style={{ color: "var(--verify-amber)" }}>
          Showing prices from cache — values below may not reflect the current rate.
        </p>
      )}

      <div className="rounded-md bg-surface-raised p-4">
        <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
          Total value
        </p>
        <p className="tabular-nums text-2xl font-semibold" style={{ color: "var(--accent-gold)" }}>
          {loading ? "…" : formatLkr(total)}
        </p>
      </div>

      {holdings.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          No saved gold yet — add your first item.
        </p>
      ) : (
        <ul className="divide-y divide-border-hairline rounded-md bg-surface-raised">
          {holdings.map((h) => {
            const value = response?.data
              ? goldValueLkr(response.data.goldUsdPerTroyOunce, response.data.usdLkrRate, h.purityKarat, h.weightGrams)
              : 0;
            return (
              <li key={h.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                    {FORM_LABELS[h.form]} &middot; {h.weightGrams}g &middot; {h.purityKarat}K
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="tabular-nums text-sm">{formatLkr(value)}</p>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="min-h-[44px] min-w-[44px] text-sm"
                    style={{ color: "var(--negative)" }}
                    aria-label={`Delete ${h.name}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd ? (
        <AddHoldingForm
          onSaved={() => {
            refresh();
            setSaveError(null);
            setShowAdd(false);
          }}
          onError={(message) => setSaveError(message)}
          onCancel={() => {
            setSaveError(null);
            setShowAdd(false);
          }}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="min-h-[44px] w-full rounded-md p-3 font-medium"
          style={{ background: "var(--accent-gold)", color: "var(--surface-base)" }}
        >
          + Add gold item
        </button>
      )}

      {saveError && (
        <p className="text-sm" style={{ color: "var(--negative)" }}>
          {saveError}
        </p>
      )}
    </main>
  );
}

function AddHoldingForm({
  onSaved,
  onError,
  onCancel,
}: {
  onSaved: () => void;
  onError: (message: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [form, setForm] = useState<HoldingForm>("biscuit");
  const [weight, setWeight] = useState("8");
  const [purity, setPurity] = useState(() => String(getDefaultPurityKarat()));

  function handleSave() {
    const weightGrams = parseFloat(weight);
    const purityKarat = parseFloat(purity);
    if (!name || !(weightGrams > 0) || !(purityKarat > 0)) return;
    const saved = saveHolding({
      id: crypto.randomUUID(),
      name,
      form,
      weightGrams,
      purityKarat,
      createdAt: new Date().toISOString(),
    });
    if (!saved) {
      onError("Could not save this item — browser storage may be blocked or full.");
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-3 rounded-md bg-surface-raised p-4">
      <input
        placeholder="Name (e.g. Wedding coin)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-h-[44px] w-full rounded-sm border border-border-hairline bg-transparent px-3 py-2"
      />
      <div className="flex gap-2">
        {(Object.keys(FORM_LABELS) as HoldingForm[]).map((f) => (
          <button
            key={f}
            onClick={() => setForm(f)}
            className="min-h-[44px] flex-1 rounded-sm border border-border-hairline text-xs"
            style={{
              background: form === f ? "var(--accent-gold)" : "transparent",
              color: form === f ? "var(--surface-base)" : "var(--ink-primary)",
            }}
          >
            {FORM_LABELS[f]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Weight (g)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="min-h-[44px] flex-1 rounded-sm border border-border-hairline bg-transparent px-3 py-2 tabular-nums"
        />
        <input
          type="number"
          placeholder="Purity (K)"
          value={purity}
          onChange={(e) => setPurity(e.target.value)}
          className="min-h-[44px] w-24 rounded-sm border border-border-hairline bg-transparent px-3 py-2 tabular-nums"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="min-h-[44px] flex-1 rounded-sm border border-border-hairline"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="min-h-[44px] flex-1 rounded-sm font-medium"
          style={{ background: "var(--accent-gold)", color: "var(--surface-base)" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
