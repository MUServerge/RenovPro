import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import { toNum } from "@/lib/money";
import Tracker from "@/components/Tracker";

export const dynamic = "force-dynamic";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const { id } = await params;
  const t = getDict(session.locale);

  const [user, entries, payments] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.workEntry.findMany({ where: { userId: id }, orderBy: { date: "asc" } }),
    prisma.payment.findMany({ where: { userId: id }, orderBy: { date: "asc" } }),
  ]);
  if (!user) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#eef1f5]">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-brand-dark px-4 py-3 text-white shadow-header">
        <Link
          href="/admin"
          className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
        >
          ← {t.back}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{user.name}</h1>
          <div className="truncate text-xs opacity-80">
            {user.position || t.worker}
          </div>
        </div>
        <Link
          href={`/admin/workers/${user.id}/edit`}
          className="whitespace-nowrap rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
          title={t.editProfile}
        >
          ✎ {t.profile}
        </Link>
        <Link
          href={`/report?u=${user.id}`}
          className="whitespace-nowrap rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/25"
          title={t.annualReport}
        >
          📄
        </Link>
      </header>

      <Tracker
        t={t}
        rate={toNum(user.hourlyRate)}
        targetUserId={user.id}
        isAdmin
        entries={entries.map((e) => ({
          id: e.id,
          date: e.date.toISOString().slice(0, 10),
          hours: toNum(e.hours),
          address: e.address ?? "",
          photoUrl: e.photoUrl ?? undefined,
        }))}
        payments={payments.map((p) => ({
          id: p.id,
          date: p.date.toISOString().slice(0, 10),
          amount: toNum(p.amount),
        }))}
      />
    </div>
  );
}
