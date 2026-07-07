"use client";

import Link from "next/link";
import { logoutAction, setLocale } from "@/lib/actions";
import { LOCALES, LOCALE_LABELS, type Dict } from "@/lib/i18n/dictionaries";
import type { SessionUser } from "@/lib/auth";

export default function TopBar({
  session,
  title,
  subtitle,
  t,
}: {
  session: SessionUser;
  title: string;
  subtitle: string;
  t: Dict;
}) {
  return (
    <header className="sticky top-0 z-20 bg-brand-dark px-4 pb-3 pt-4 text-white shadow-header">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-wide">{title}</h1>
          <div className="mt-0.5 truncate text-xs opacity-80">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          {session.role === "worker" && (
            <Link
              href="/report"
              className="rounded-lg bg-white/15 px-2.5 py-1.5 text-sm hover:bg-white/25"
              aria-label={t.annualReport}
              title={t.annualReport}
            >
              📄
            </Link>
          )}
          <Link
            href="/dashboard/profile"
            className="rounded-lg bg-white/15 px-2.5 py-1.5 text-sm hover:bg-white/25"
            aria-label={t.profile}
            title={t.profile}
          >
            👤
          </Link>
          <form action={setLocale}>
            <select
              name="locale"
              defaultValue={session.locale}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-lg bg-white/15 px-2 py-1.5 text-xs font-semibold text-white outline-none"
              aria-label={t.language}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l} className="text-brand-txt">
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </select>
          </form>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              {t.logout}
            </button>
          </form>
        </div>
      </div>
      <div className="mt-2 text-xs opacity-70">
        {session.name} ·{" "}
        {session.role === "admin" ? t.admin : t.worker}
      </div>
    </header>
  );
}
