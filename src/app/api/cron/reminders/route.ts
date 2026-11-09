// Daily reminder: called by Vercel Cron (see vercel.json) every evening
// Monday–Saturday. Sends a phone notification to each active worker who has
// enabled reminders and has not logged any work for today.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import { pushConfigured, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

const TZ = process.env.REMINDER_TZ || "Europe/Paris";

function todayInTz(): { date: string; weekday: string } {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(now);
  return { date, weekday };
}

export async function GET(req: Request) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ skipped: "push not configured" });
  }

  const { date, weekday } = todayInTz();
  if (weekday === "Sun") {
    return NextResponse.json({ skipped: "sunday" });
  }

  const day = new Date(`${date}T00:00:00.000Z`);
  const workers = await prisma.user.findMany({
    where: {
      role: "worker",
      status: "active",
      pushSubscriptions: { some: {} },
      workEntries: { none: { date: day } },
    },
    select: { id: true, locale: true },
  });

  let sent = 0;
  for (const w of workers) {
    const t = getDict(w.locale);
    const n = await sendPushToUser(w.id, {
      title: t.appName,
      body: t.pushReminderBody,
      url: "/dashboard",
    });
    if (n > 0) {
      sent += n;
      await prisma.notificationLog.create({
        data: { userId: w.id, type: "daily_reminder" },
      });
    }
  }

  return NextResponse.json({ date, workers: workers.length, sent });
}
