"use client";

import { useEffect, useState, type ReactNode } from "react";
import { hydrateStoreFromBackup, requestPersistentStorage } from "@/lib/storage";

export function StorageBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await hydrateStoreFromBackup();
      await requestPersistentStorage();
      if (!cancelled) setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-surface-raised" />
      </div>
    );
  }

  return children;
}
