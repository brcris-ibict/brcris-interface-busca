import { useEffect, useState } from "react";
import type { ViewMode } from "../types";

export function useViewMode(entityKey: string) {
  const viewModeStorageKey = entityKey ? `viewMode:${entityKey}` : "";
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (!viewModeStorageKey) return;
    const saved = window.localStorage.getItem(viewModeStorageKey);
    if (saved === "table" || saved === "list") {
      setViewMode(saved);
      return;
    }
    setViewMode("list");
  }, [viewModeStorageKey]);

  useEffect(() => {
    if (!viewModeStorageKey) return;
    window.localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewMode, viewModeStorageKey]);

  return { viewMode, setViewMode };
}
