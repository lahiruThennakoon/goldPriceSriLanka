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

function mergeHoldings(a: Holding[], b: Holding[]): Holding[] {
  const map = new Map<string, Holding>();
  for (const holding of a) map.set(holding.id, holding);
  for (const holding of b) map.set(holding.id, holding);
  return Array.from(map.values()).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

function mergeHistory(a: HistorySnapshot[], b: HistorySnapshot[]): HistorySnapshot[] {
  const map = new Map<string, HistorySnapshot>();
  for (const snapshot of a) map.set(snapshot.timestamp, snapshot);
  for (const snapshot of b) map.set(snapshot.timestamp, snapshot);
  return Array.from(map.values())
    .sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime())
    .slice(-HISTORY_CAP);
}

function mergeStores(primary: StoreShape, secondary: StoreShape): StoreShape {
  return {
    holdings: mergeHoldings(primary.holdings, secondary.holdings),
    settings: { ...DEFAULT_SETTINGS, ...primary.settings, ...secondary.settings },
    history: mergeHistory(primary.history, secondary.history),
  };
}

function storeScore(store: StoreShape): number {
  return store.holdings.length * 1000 + store.history.length;
}

function notifyStoreUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(STORE_UPDATED_EVENT));
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

async function mirrorToIndexedDb(payload: string): Promise<void> {
  if (!isBrowser() || !("indexedDB" in window)) return;
  try {
    const db = await openDb();
    await idbPut(db, ROOT_KEY, payload);
  } catch {
    // Non-fatal backup path.
  }
}

function writeStore(store: StoreShape, options?: { mergeHoldings?: boolean; awaitBackup?: boolean }): boolean {
  if (!isBrowser()) return false;

  let next = store;
  if (options?.mergeHoldings) {
    const live = readStore();
    next = {
      ...store,
      holdings: mergeHoldings(live.holdings, store.holdings),
      history: mergeHistory(live.history, store.history),
    };
  }

  try {
    const payload = JSON.stringify(next);
    window.localStorage.setItem(ROOT_KEY, payload);
    if (window.localStorage.getItem(ROOT_KEY) !== payload) {
      return false;
    }
    if (options?.awaitBackup) {
      void mirrorToIndexedDb(payload);
    } else {
      void mirrorToIndexedDb(payload);
    }
    notifyStoreUpdated();
    return true;
  } catch {
    return false;
  }
}

async function readIndexedDbStore(): Promise<StoreShape | null> {
  if (!isBrowser() || !("indexedDB" in window)) return null;
  try {
    const db = await openDb();
    const backup = await idbGet(db, ROOT_KEY);
    if (!backup) return null;
    return parseStore(backup);
  } catch {
    return null;
  }
}

/** Merge localStorage with IndexedDB on startup so holdings survive tab races and storage eviction. */
export async function hydrateStoreFromBackup(): Promise<boolean> {
  if (!isBrowser()) return false;

  const localRaw = window.localStorage.getItem(ROOT_KEY);
  const local = localRaw ? parseStore(localRaw) : null;
  const idb = await readIndexedDbStore();

  if (!local && !idb) return false;

  if (!local && idb) {
    window.localStorage.setItem(ROOT_KEY, JSON.stringify(idb));
    notifyStoreUpdated();
    await mirrorToIndexedDb(JSON.stringify(idb));
    return true;
  }

  if (local && !idb) {
    await mirrorToIndexedDb(JSON.stringify(local));
    return false;
  }

  const merged = mergeStores(local!, idb!);
  const mergedPayload = JSON.stringify(merged);
  const needsSync =
    storeScore(merged) > storeScore(local!) ||
    merged.holdings.length > local!.holdings.length ||
    mergedPayload !== localRaw;

  if (needsSync) {
    window.localStorage.setItem(ROOT_KEY, mergedPayload);
    notifyStoreUpdated();
    await mirrorToIndexedDb(mergedPayload);
    return true;
  }

  return false;
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
  return writeStore(store, { awaitBackup: true });
}

export function deleteHolding(id: string): boolean {
  const store = readStore();
  store.holdings = store.holdings.filter((h) => h.id !== id);
  return writeStore(store, { awaitBackup: true });
}

export function getSettings(): Settings {
  return readStore().settings;
}

export function getDefaultPurityKarat(): number {
  return getSettings().defaultPurity;
}

/** Map settings purity to the nearest history chart band (22K or 24K). */
export function getDefaultHistoryPurity(): "24k" | "22k" {
  return getDefaultPurityKarat() >= 23 ? "24k" : "22k";
}

export function saveSettings(settings: Settings): boolean {
  const store = readStore();
  store.settings = settings;
  return writeStore(store, { mergeHoldings: true });
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

  if (writeStore(store, { mergeHoldings: true }) && isBrowser()) {
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
