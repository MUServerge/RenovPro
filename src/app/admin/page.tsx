import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import { eur, toNum } from "@/lib/money";
import TopBar from "@/components/TopBar";
import AddWorkerForm from "@/components/AddWorkerForm";

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

        {/* Workers table */}
        <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-brand-muted">
          {t.workers}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white shadow-card">
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
