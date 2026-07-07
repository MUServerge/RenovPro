"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logoutAction, setLocale } from "@/lib/actions";
import { LOCALES, LOCALE_LABELS, type Dict } from "@/lib/i18n/dictionaries";
import type { SessionUser } from "@/lib/auth";

export default function TopBar({
  session,
  title,
  t,
}: {
  session: SessionUser;
  title: string;
  t: Dict;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-brand-dark px-4 pb-3 pt-4 text-white shadow-header">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-wide">{title}</h1>
          <div className="mt-0.5 truncate text-xs opacity-80">
            {session.name} · {session.role === "admin" ? t.admin : t.worker}
          </div>
        </div>

        <div className="relative shrink-0" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-2xl border border-brand-line bg-white text-brand-txt shadow-lg">
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-brand-light/50"
              >
                <span className="w-5 text-center">👤</span>
                {t.profile}
              </Link>

              {session.role === "worker" && (
                <Link
                  href="/report"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-t border-brand-line px-4 py-3 text-sm font-semibold hover:bg-brand-light/50"
                >
                  <span className="w-5 text-center">📄</span>
                  {t.annualReport}
                </Link>
              )}

              <div className="border-t border-brand-line px-4 py-3">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-muted">
                  {t.language}
                </div>
                <form action={setLocale}>
                  <select
                    name="locale"
                    defaultValue={session.locale}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="w-full rounded-lg border border-brand-line bg-white px-2.5 py-2 text-sm font-semibold text-brand-txt outline-none"
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {LOCALE_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </form>
              </div>

              <form action={logoutAction} className="border-t border-brand-line">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-brand-danger hover:bg-brand-light/50"
                >
                  <span className="w-5 text-center">⏻</span>
                  {t.logout}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
