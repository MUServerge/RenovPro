import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import { eur, toNum } from "@/lib/money";
import TopBar from "@/components/TopBar";
import AddWorkerForm from "@/components/AddWorkerForm";
import BarChart, { type Bar } from "@/components/BarChart";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const t = getDict(session.locale);

  const workers = await prisma.user.findMany({
    where: { role: "worker" },
    orderBy: { name: "asc" },
    include: { workEntries: true, payments: true },
  });

  const rows = workers.map((w) => {
    const hours = w.workEntries.reduce((s, e) => s + toNum(e.hours), 0);
    const salary = hours * toNum(w.hourlyRate);
    const paid = w.payments.reduce((s, p) => s + toNum(p.amount), 0);
    return {
      id: w.id,
      name: w.name,
      position: w.position,
      status: w.status,
      rate: toNum(w.hourlyRate),
      hours,
      balance: salary - paid,
    };
  });

  const topHours = [...rows].sort((a, b) => b.hours - a.hours)[0];
  const topBalance = [...rows].sort((a, b) => b.balance - a.balance)[0];

  // ── Analytics aggregates (across all workers) ──
  const rateOf = new Map(workers.map((w) => [w.id, toNum(w.hourlyRate)]));

  const monthMap = new Map<string, number>();
  const siteMap = new Map<string, number>();
  for (const w of workers) {
    const rate = rateOf.get(w.id) ?? 0;
    for (const e of w.workEntries) {
      const month = e.date.toISOString().slice(0, 7); // YYYY-MM
      const hours = toNum(e.hours);
      monthMap.set(month, (monthMap.get(month) ?? 0) + hours * rate);
      const site = e.address?.trim() || "—";
      siteMap.set(site, (siteMap.get(site) ?? 0) + hours);
    }
  }

  const costByMonth: Bar[] = [...monthMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-6)
    .map(([m, v]) => ({ label: m, value: Math.round(v) }));

  const hoursBySite: Bar[] = [...siteMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s, v]) => ({ label: s, value: Math.round(v * 10) / 10 }));

  const hoursByWorker: Bar[] = [...rows]
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8)
    .map((r) => ({ label: r.name, value: Math.round(r.hours * 10) / 10 }));

  const statusLabel = (s: string) =>
    s === "active"
      ? t.statusActive
      : s === "on_leave"
        ? t.statusOnLeave
        : t.statusTerminated;

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-[#eef1f5]">
      <TopBar session={session} title={t.appName} subtitle={t.dashboard} t={t} />

      <div className="p-4">
        {/* Overview */}
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-muted">
          {t.overview}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label={t.workers} value={String(rows.length)} tone="light" />
          <StatCard
            label={t.topHours}
            value={topHours ? `${topHours.name} · ${topHours.hours.toFixed(0)}h` : "—"}
            tone="green"
          />
          <StatCard
            label={t.topBalance}
            value={topBalance ? `${topBalance.name} · ${eur(topBalance.balance)}` : "—"}
            tone="orange"
          />
        </div>

        {/* Analytics */}
        <div className="mb-2 mt-6 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted">
            {t.analytics}
          </h2>
          <a
            href="/api/admin/export-all"
            className="rounded-lg border border-brand-dark bg-white px-3 py-1.5 text-xs font-bold text-brand-dark"
          >
            ⬇ {t.exportAll}
          </a>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ChartCard title={t.costByMonth}>
            <BarChart data={costByMonth} unit=" €" color="#2E75B6" />
          </ChartCard>
          <ChartCard title={t.hoursBySite}>
            <BarChart data={hoursBySite} unit=" h" color="#5a9e5f" />
          </ChartCard>
          <ChartCard title={t.hoursByWorker}>
            <BarChart data={hoursByWorker} unit=" h" color="#e08a4b" />
          </ChartCard>
        </div>

        {/* Workers table */}
        <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-brand-muted">
          {t.workers}
        </h2>
        {/* Mobile: stacked cards (no horizontal scroll) */}
        <div className="space-y-2 sm:hidden">
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-brand-line bg-white p-4 text-center text-brand-muted shadow-card">
              —
            </p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-brand-line bg-white p-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-brand-txt">{r.name}</div>
                    <div className="text-xs text-brand-muted">
                      {(r.position || "—") + " · " + statusLabel(r.status)}
                    </div>
                  </div>
                  <Link
                    href={`/admin/workers/${r.id}`}
                    className="whitespace-nowrap rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {t.viewDetails}
                  </Link>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-brand-light py-1.5">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-brand-dark">
                      {t.rate}
                    </div>
                    <div className="text-sm font-extrabold text-brand-dark">
                      {r.rate.toFixed(2)} €
                    </div>
                  </div>
                  <div className="rounded-lg bg-brand-green py-1.5">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-brand-dark">
                      {t.totalHours}
                    </div>
                    <div className="text-sm font-extrabold text-brand-dark">
                      {r.hours.toFixed(1)} h
                    </div>
                  </div>
                  <div className="rounded-lg bg-brand-yellow py-1.5">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-brand-dark">
                      {t.outstanding}
                    </div>
                    <div className="text-sm font-extrabold text-brand-dark">
                      {eur(r.balance)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-brand-line bg-white shadow-card sm:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-brand-light text-xs uppercase text-brand-dark">
              <tr>
                <th className="px-4 py-3 font-bold">{t.name}</th>
                <th className="px-4 py-3 font-bold">{t.position}</th>
                <th className="px-4 py-3 font-bold">{t.status}</th>
                <th className="px-4 py-3 text-right font-bold">{t.rate}</th>
                <th className="px-4 py-3 text-right font-bold">{t.totalHours}</th>
                <th className="px-4 py-3 text-right font-bold">{t.outstanding}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                    —
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-brand-line">
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    <td className="px-4 py-3 text-brand-muted">{r.position || "—"}</td>
                    <td className="px-4 py-3">{statusLabel(r.status)}</td>
                    <td className="px-4 py-3 text-right">{r.rate.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right">{r.hours.toFixed(1)} h</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-dark">
                      {eur(r.balance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/workers/${r.id}`}
                        className="rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-bold text-white"
                      >
                        {t.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add worker */}
        <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-brand-muted">
          {t.addWorker}
        </h2>
        <AddWorkerForm t={t} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "light" | "green" | "orange";
}) {
  const bg =
    tone === "green"
      ? "bg-brand-green"
      : tone === "orange"
        ? "bg-brand-orange"
        : "bg-brand-light";
  return (
    <div className={`rounded-2xl border border-brand-dark/15 ${bg} p-4 shadow-card`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold text-brand-txt">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-card">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
        {title}
      </div>
      {children}
    </div>
  );
}
