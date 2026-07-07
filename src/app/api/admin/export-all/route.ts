import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const workers = await prisma.user.findMany({
    where: { role: "worker" },
    orderBy: { name: "asc" },
    include: {
      workEntries: { orderBy: { date: "asc" } },
      payments: { orderBy: { date: "asc" } },
    },
  });

  let csv = "MaysterPRO — All workers export\n\n";
  csv +=
    "Worker,Position,Rate (EUR),Total hours,Salary (EUR),Paid (EUR),Balance (EUR)\n";

  for (const w of workers) {
    const rate = toNum(w.hourlyRate);
    const hours = w.workEntries.reduce((s, e) => s + toNum(e.hours), 0);
    const salary = hours * rate;
    const paid = w.payments.reduce((s, p) => s + toNum(p.amount), 0);
    csv +=
      [
        csvCell(w.name),
        csvCell(w.position ?? ""),
        rate.toFixed(2),
        hours.toFixed(2),
        salary.toFixed(2),
        paid.toFixed(2),
        (salary - paid).toFixed(2),
      ].join(",") + "\n";
  }

  csv += "\n\nDetailed work entries\nWorker,Date,Hours,Address,Amount (EUR)\n";
  for (const w of workers) {
    const rate = toNum(w.hourlyRate);
    for (const e of w.workEntries) {
      csv +=
        [
          csvCell(w.name),
          e.date.toISOString().slice(0, 10),
          toNum(e.hours).toFixed(2),
          csvCell(e.address ?? ""),
          (toNum(e.hours) * rate).toFixed(2),
        ].join(",") + "\n";
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="MaysterPRO_all_${today}.csv"`,
    },
  });
}
