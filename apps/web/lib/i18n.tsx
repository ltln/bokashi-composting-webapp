"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_STORAGE_KEY = "bk_locale";

let memoryLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function parseLocale(raw: string | null | undefined): Locale | null {
  return raw === "vi" || raw === "en" ? raw : null;
}

function getSnapshot(): Locale {
  if (typeof window === "undefined") return memoryLocale;
  try {
    return parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)) ?? memoryLocale;
  } catch {
    return memoryLocale;
  }
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === LOCALE_STORAGE_KEY) {
      memoryLocale = parseLocale(e.newValue) ?? DEFAULT_LOCALE;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Sets the active UI locale, persists it to localStorage, and notifies subscribers. */
export function setLocale(next: Locale): void {
  memoryLocale = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  }
  for (const listener of listeners) {
    listener();
  }
}

/** Toggles between Vietnamese ("vi") and English ("en"). */
export function toggleLocale(): void {
  setLocale(getSnapshot() === "vi" ? "en" : "vi");
}

/** React hook returning the active locale and setters synchronized across tabs/components. */
export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
} {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { locale, setLocale, toggleLocale };
}

/** Syncs `<html lang>` with the active locale on the client. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
