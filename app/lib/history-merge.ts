import type { HistorySnapshot } from "@/lib/storage";

const LOCAL_PREFERENCE_MS = 30 * 60 * 1000;

/** Merge market backfill with on-device snapshots; local readings win when close in time. */
export function mergeHistorySnapshots(
  market: HistorySnapshot[],
  local: HistorySnapshot[]
): HistorySnapshot[] {
  const merged = [...market];

  for (const localPoint of local) {
    const localTs = new Date(localPoint.timestamp).getTime();
    const replaceIdx = merged.findIndex(
      (m) => Math.abs(new Date(m.timestamp).getTime() - localTs) < LOCAL_PREFERENCE_MS
    );

    if (replaceIdx >= 0) {
      merged[replaceIdx] = localPoint;
    } else {
      merged.push(localPoint);
    }
  }

  return merged.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
