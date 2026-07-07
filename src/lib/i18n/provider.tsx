"use client";

import { createContext, useContext } from "react";
import type { Dict, Locale } from "./dictionaries";

type I18nValue = { t: Dict; locale: Locale };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  t,
  locale,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ t, locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
