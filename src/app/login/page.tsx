import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDict, LOCALES, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/dictionaries";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "admin" ? "/admin" : "/dashboard");

  const { lang } = await searchParams;
  const locale: Locale = LOCALES.includes(lang as Locale)
    ? (lang as Locale)
    : DEFAULT_LOCALE;
  const t = getDict(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef1f5] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-brand-dark">
            {t.appName}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">{t.tagline}</p>
        </div>
        <LoginForm t={t} locale={locale} />
        <div className="mt-6 flex justify-center gap-3 text-xs">
          {LOCALES.map((l) => (
            <a
              key={l}
              href={`/login?lang=${l}`}
              className={
                l === locale
                  ? "font-bold text-brand-dark"
                  : "text-brand-muted hover:text-brand-dark"
              }
            >
              {l.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
