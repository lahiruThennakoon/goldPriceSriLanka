// AD-3: all user state lives in browser storage under one namespaced root key.
const ROOT_KEY = "goldpwa.v1";

export type HoldingForm = "biscuit" | "coin" | "bar" | "other";

export interface Holding {
  id: string;
  name: string;
  form: HoldingForm;
  weightGrams: number;
  purityKarat: number;
  createdAt: string;
}

export type ThresholdStyle = "percentage" | "absolute";

export interface ThresholdAlert {
  id: string;
  style: ThresholdStyle;
  value: number;
  createdAt: string;
}

export interface Settings {
  defaultPurity: number;
  defaultWeightUnit: "grams" | "pavan";
  theme: "system" | "light" | "dark";
  refreshIntervalMinutes: number;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string; // "HH:MM"
  alerts: ThresholdAlert[];
}

export interface HistorySnapshot {
  timestamp: string;
  lkrPerPavan24k: number;
  lkrPerPavan22k: number;
}

interface StoreShape {
  holdings: Holding[];
  settings: Settings;
  history: HistorySnapshot[];
}

const DEFAULT_SETTINGS: Settings = {
  defaultPurity: 24,
  defaultWeightUnit: "grams",
  theme: "system",
  refreshIntervalMinutes: 15,
  dailyDigestEnabled: false,
  dailyDigestTime: "08:00",
  alerts: [],
};

const DEFAULT_STORE: StoreShape = {
  holdings: [],
  settings: DEFAULT_SETTINGS,
  history: [],
};

const HISTORY_CAP = 400; // ring-buffer cap, AD-4

function isBrowser() {
  return typeof window !== "undefined";
}

function readStore(): StoreShape {
  if (!isBrowser()) return DEFAULT_STORE;
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw);
    return {
      holdings: parsed.holdings ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      history: parsed.history ?? [],
    };
  } catch {
    return DEFAULT_STORE;
  }
}

function writeStore(store: StoreShape) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ROOT_KEY, JSON.stringify(store));
}

export function getHoldings(): Holding[] {
  return readStore().holdings;
}

export function saveHolding(holding: Holding) {
  const store = readStore();
  const idx = store.holdings.findIndex((h) => h.id === holding.id);
  if (idx >= 0) store.holdings[idx] = holding;
  else store.holdings.push(holding);
  writeStore(store);
}

export function deleteHolding(id: string) {
  const store = readStore();
  store.holdings = store.holdings.filter((h) => h.id !== id);
  writeStore(store);
}

export function getSettings(): Settings {
  return readStore().settings;
}

export function saveSettings(settings: Settings) {
  const store = readStore();
  store.settings = settings;
  writeStore(store);
}

export function getHistory(): HistorySnapshot[] {
  return readStore().history;
}

export function appendHistorySnapshot(snapshot: HistorySnapshot) {
  const store = readStore();
  store.history.push(snapshot);
  if (store.history.length > HISTORY_CAP) {
    store.history = store.history.slice(store.history.length - HISTORY_CAP);
  }
  writeStore(store);
}

export function shouldCaptureSnapshot(lastSnapshotIso: string | undefined, refreshIntervalMinutes: number): boolean {
  if (!lastSnapshotIso) return true;
  const last = new Date(lastSnapshotIso).getTime();
  const now = Date.now();
  return now - last >= refreshIntervalMinutes * 60_000;
}
