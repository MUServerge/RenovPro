"use client";

import { useEffect, useRef, useState } from "react";
import { setLocale } from "@/lib/actions";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_FLAGS,
  type Locale,
} from "@/lib/i18n/dictionaries";

export default function LanguageSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const flag = LOCALE_FLAGS[current as Locale] ?? "🌐";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-xl hover:bg-white/25"
      >
        {flag}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-2xl border border-brand-line bg-white text-brand-txt shadow-lg">
          {LOCALES.map((l) => (
            <form action={setLocale} key={l}>
              <input type="hidden" name="locale" value={l} />
              <button
                type="submit"
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-brand-light/50 ${
                  l === current ? "bg-brand-light/40" : ""
                }`}
              >
                <span className="text-lg">{LOCALE_FLAGS[l]}</span>
                {LOCALE_LABELS[l]}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
