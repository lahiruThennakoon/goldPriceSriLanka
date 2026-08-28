// AD-3: all user state lives in browser storage under one namespaced root key.
const ROOT_KEY = "goldpwa.v1";
const IDB_NAME = "goldpwa";
const IDB_STORE = "kv";
const SESSION_HISTORY_KEY = "goldpwa.v1.historyCaptured";
const STORE_UPDATED_EVENT = "goldpwa:store-updated";

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

const HISTORY_CAP = 400; // ring-buffer cap, AD-4

function isBrowser() {
  return typeof window !== "undefined";
}

function emptyStore(): StoreShape {
  return {
    holdings: [],
    settings: { ...DEFAULT_SETTINGS },
    history: [],
  };
}

function parseStore(raw: string): StoreShape | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      holdings: Array.isArray(parsed.holdings) ? parsed.holdings : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return null;
  }
}

function readStore(): StoreShape {
  if (!isBrowser()) return emptyStore();
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return emptyStore();
    return parseStore(raw) ?? emptyStore();
  } catch {
    return emptyStore();
  }
}

function notifyStoreUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(STORE_UPDATED_EVENT));
}

function mirrorToIndexedDb(payload: string) {
  if (!isBrowser() || !("indexedDB" in window)) return;
  void openDb()
    .then((db) => idbPut(db, ROOT_KEY, payload))
    .catch(() => {
      // Non-fatal backup path.
    });
}

function writeStore(store: StoreShape): boolean {
  if (!isBrowser()) return false;
  try {
    const payload = JSON.stringify(store);
    window.localStorage.setItem(ROOT_KEY, payload);
    if (window.localStorage.getItem(ROOT_KEY) !== payload) {
      return false;
    }
    mirrorToIndexedDb(payload);
    notifyStoreUpdated();
    return true;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const request = tx.objectStore(IDB_STORE).get(key);
    request.onsuccess = () => resolve((request.result as string | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function hydrateStoreFromBackup(): Promise<boolean> {
  if (!isBrowser()) return false;
  if (window.localStorage.getItem(ROOT_KEY)) return false;
  if (!("indexedDB" in window)) return false;

  try {
    const db = await openDb();
    const backup = await idbGet(db, ROOT_KEY);
    if (!backup || !parseStore(backup)) return false;
    window.localStorage.setItem(ROOT_KEY, backup);
    notifyStoreUpdated();
    return true;
  } catch {
    return false;
  }
}

export async function requestPersistentStorage(): Promise<void> {
  if (!isBrowser()) return;
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // Best-effort only.
  }
}

export function getHoldings(): Holding[] {
  return readStore().holdings;
}

export function saveHolding(holding: Holding): boolean {
  const store = readStore();
  const idx = store.holdings.findIndex((h) => h.id === holding.id);
  if (idx >= 0) store.holdings[idx] = holding;
  else store.holdings.push(holding);
  return writeStore(store);
}

export function deleteHolding(id: string): boolean {
  const store = readStore();
  store.holdings = store.holdings.filter((h) => h.id !== id);
  return writeStore(store);
}

export function getSettings(): Settings {
  return readStore().settings;
}

export function saveSettings(settings: Settings): boolean {
  const store = readStore();
  store.settings = settings;
  return writeStore(store);
}

export function getHistory(): HistorySnapshot[] {
  return readStore().history;
}

export function getLastHistorySnapshot(): HistorySnapshot | undefined {
  const history = readStore().history;
  return history[history.length - 1];
}

export function appendHistorySnapshot(snapshot: HistorySnapshot) {
  const store = readStore();
  const last = store.history[store.history.length - 1];
  const sessionCaptured = isBrowser() && sessionStorage.getItem(SESSION_HISTORY_KEY) === "1";

  if (sessionCaptured && last && !shouldCaptureSnapshot(last.timestamp, store.settings.refreshIntervalMinutes)) {
    return;
  }

  store.history.push(snapshot);
  if (store.history.length > HISTORY_CAP) {
    store.history = store.history.slice(store.history.length - HISTORY_CAP);
  }

  if (writeStore(store) && isBrowser()) {
    sessionStorage.setItem(SESSION_HISTORY_KEY, "1");
  }
}

export function subscribeStoreUpdates(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === ROOT_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(STORE_UPDATED_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORE_UPDATED_EVENT, onCustom);
  };
}

/** @deprecated Use subscribeStoreUpdates */
export const subscribeHistoryUpdates = subscribeStoreUpdates;

export function shouldCaptureSnapshot(lastSnapshotIso: string | undefined, refreshIntervalMinutes: number): boolean {
  if (!lastSnapshotIso) return true;
  const last = new Date(lastSnapshotIso).getTime();
  const now = Date.now();
  return now - last >= refreshIntervalMinutes * 60_000;
}
