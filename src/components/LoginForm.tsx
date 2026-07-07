"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";
import type { Dict, Locale } from "@/lib/i18n/dictionaries";

export default function LoginForm({ t, locale }: { t: Dict; locale: Locale }) {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-brand-line bg-white p-6 shadow-card"
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="mb-1 block text-xs font-semibold text-brand-muted">
        {t.email}
      </label>
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        className="mb-4 w-full rounded-xl border border-brand-line p-3 text-base outline-none focus:border-brand-med"
      />
      <label className="mb-1 block text-xs font-semibold text-brand-muted">
        {t.password}
      </label>
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mb-4 w-full rounded-xl border border-brand-line p-3 text-base outline-none focus:border-brand-med"
      />
      {state?.error && (
        <p className="mb-3 text-sm font-medium text-brand-danger">
          {t.loginError}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-dark py-3 font-bold text-white disabled:opacity-60"
      >
        {t.signIn}
      </button>
    </form>
  );
}
