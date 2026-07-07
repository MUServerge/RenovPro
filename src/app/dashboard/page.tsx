import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import { toNum } from "@/lib/money";
import Tracker from "@/components/Tracker";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [user, entries, payments] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id } }),
    prisma.workEntry.findMany({
      where: { userId: session.id },
      orderBy: { date: "asc" },
    }),
    prisma.payment.findMany({
      where: { userId: session.id },
      orderBy: { date: "asc" },
    }),
  ]);
  if (!user) redirect("/login");

  const t = getDict(session.locale);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#eef1f5]">
      <TopBar
        session={session}
        title={t.appName}
        t={t}
      />
      <Tracker
        t={t}
        rate={toNum(user.hourlyRate)}
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
