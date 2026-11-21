"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type Entry, type Settings } from "./finance";

// 이 브라우저에만 저장됩니다 (다른 기기와 공유 안 됨)
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...(fallback as object), ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function usePersisted<T>(key: string, fallback: T, merge = true) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(merge ? load(key, fallback) : JSON.parse(raw));
    } catch {}
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
}

export const useSettings = () => usePersisted<Settings>("home.settings.v1", DEFAULT_SETTINGS);
export const useEntries = () => usePersisted<Entry[]>("home.entries.v1", [], false);
