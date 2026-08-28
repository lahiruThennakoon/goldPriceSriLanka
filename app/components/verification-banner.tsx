import { formatLkr } from "@/lib/gold-math";

export function VerificationBanner({
  calculatedLkrPerPavan22k,
  referenceLkrPerPavan22k,
  referenceIsSample,
}: {
  calculatedLkrPerPavan22k: number;
  referenceLkrPerPavan22k: number;
  referenceIsSample: boolean;
}) {
  const diffPct =
    ((calculatedLkrPerPavan22k - referenceLkrPerPavan22k) / referenceLkrPerPavan22k) * 100;
  const diverges = Math.abs(diffPct) > 0.5;

  return (
    <div
      className="rounded-md bg-surface-raised p-4"
      style={{ borderLeft: `3px solid var(--verify-amber)` }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--verify-amber)" }}>
        {diverges ? "This calculation differs from the reference price" : "Within expected range of the reference price"}
      </p>
      <p className="tabular-nums mt-2 text-sm" style={{ color: "var(--ink-primary)" }}>
        Reference: {formatLkr(referenceLkrPerPavan22k)} &middot; This calculation: {formatLkr(calculatedLkrPerPavan22k)}
      </p>
      <p className="mt-2 text-xs" style={{ color: "var(--ink-secondary)" }}>
        This app never claims to be an actual buy/sell quote from any jeweller — it is an
        estimated, spot-derived value only.
        {referenceIsSample &&
          " (Reference price shown is sample data — a real local reference source is still being selected.)"}
      </p>
    </div>
  );
}
