"use client";

import { useEffect } from "react";
import { subscribeStoreUpdates } from "@/lib/storage";

export function useStoreRefresh(refresh: () => void) {
  useEffect(() => {
    refresh();

    const unsubscribe = subscribeStoreUpdates(refresh);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);
}
