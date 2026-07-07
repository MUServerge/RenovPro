import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import { eur, toNum } from "@/lib/money";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { u, year: yearParam } = await searchParams;
  const isAdmin = session.role === "admin";
  const targetId = isAdmin && u ? u : session.id;
  const year = Number(yearParam) || new Date().getFullYear();

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) notFound();

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const [entries, payments] = await Promise.all([
    prisma.workEntry.findMany({
      where: { userId: targetId, date: { gte: start, lt: end } },
    }),
    prisma.payment.findMany({
      where: { userId: targetId, date: { gte: start, lt: end } },
    }),
  ]);

  const t = getDict(session.locale);
  const rate = toNum(user.hourlyRate);

  // Per-month aggregation.
  const months = Array.from({ length: 12 }, (_, m) => {
    const es = entries.filter((e) => e.date.getUTCMonth() === m);
    const hours = es.reduce((s, e) => s + toNum(e.hours), 0);
    const ps = payments.filter((p) => p.date.getUTCMonth() === m);
    const paid = ps.reduce((s, p) => s + toNum(p.amount), 0);
    return {
      name: new Date(Date.UTC(year, m, 1)).toLocaleString(session.locale, {
        month: "long",
      }),
      hours,
      salary: hours * rate,
      paid,
    };
  }).filter((m) => m.hours > 0 || m.paid > 0);

  const totalHours = entries.reduce((s, e) => s + toNum(e.hours), 0);
  const totalSalary = totalHours * rate;
  const totalPaid = payments.reduce((s, p) => s + toNum(p.amount), 0);

  const backHref = isAdmin && u ? `/admin/workers/${targetId}` : "/dashboard";

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white p-5 text-brand-txt">
      <div className="no-print mb-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={backHref}
            className="rounded-lg border border-brand-line px-3 py-1.5 text-sm font-semibold text-brand-dark"
          >
            ← {t.back}
          </Link>
          <PrintButton label={t.print} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[year - 1, year, year + 1].map((y) => (
            <Link
              key={y}
              href={`/report?year=${y}${u ? `&u=${u}` : ""}`}
              className={
                y === year
                  ? "rounded-lg bg-brand-dark px-4 py-1.5 text-sm font-bold text-white"
                  : "rounded-lg border border-brand-line px-4 py-1.5 text-sm text-brand-dark"
              }
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      {/* Report header */}
      <div className="mb-4 border-b border-brand-line pb-4">
        <div className="text-sm font-bold uppercase tracking-wide text-brand-med">
          MaysterPRO · {t.annualReport}
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-brand-dark">
          {user.name} — {year}
        </h1>
        <div className="mt-1 text-sm text-brand-muted">
          {(user.position || t.worker) + " · " + t.hourlyRate + ": " + rate.toFixed(2) + " €"}
        </div>
      </div>

      {/* Monthly table */}
      <table className="w-full text-left text-sm">
        <thead className="border-b border-brand-line text-xs uppercase text-brand-muted">
          <tr>
            <th className="py-2">{t.month}</th>
            <th className="py-2 text-right">{t.hours}</th>
            <th className="py-2 text-right">{t.salaryTotal}</th>
            <th className="py-2 text-right">{t.paid}</th>
          </tr>
        </thead>
        <tbody>
          {months.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-brand-muted">
                —
              </td>
            </tr>
          ) : (
            months.map((m, i) => (
              <tr key={i} className="border-b border-brand-line/60">
                <td className="py-2 font-semibold capitalize">{m.name}</td>
                <td className="py-2 text-right">{m.hours.toFixed(1)} h</td>
                <td className="py-2 text-right">{eur(m.salary)}</td>
                <td className="py-2 text-right text-[#2e8b57]">
                  {m.paid ? eur(m.paid) : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Total label={t.hours} value={`${totalHours.toFixed(1)} h`} tone="light" />
        <Total label={t.salaryTotal} value={eur(totalSalary)} tone="green" />
        <Total label={t.paid} value={eur(totalPaid)} tone="orange" />
        <Total label={t.balanceDue} value={eur(totalSalary - totalPaid)} tone="yellow" />
      </div>
    </div>
  );
}

function Total({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "light" | "green" | "orange" | "yellow";
}) {
  const bg = {
    light: "bg-brand-light",
    green: "bg-brand-green",
    orange: "bg-brand-orange",
    yellow: "bg-brand-yellow",
  }[tone];
  return (
    <div className={`rounded-xl border border-brand-dark/15 ${bg} p-3`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-brand-dark">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold text-brand-txt">{value}</div>
    </div>
  );
}
