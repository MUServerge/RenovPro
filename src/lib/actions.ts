"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSession,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { parseNum } from "@/lib/money";
import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";

// ---- Auth ----

export async function loginAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "loginError" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "loginError" };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
  });
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ---- Audit helper ----

async function audit(
  actorUserId: string,
  tableName: string,
  recordId: string,
  action: AuditAction,
  oldValue: Prisma.InputJsonValue | null,
  newValue: Prisma.InputJsonValue | null,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      tableName,
      recordId,
      action,
      oldValue: oldValue ?? Prisma.JsonNull,
      newValue: newValue ?? Prisma.JsonNull,
    },
  });
}

// Resolve which user a mutation targets: workers may only touch their own data;
// admins may pass an explicit targetUserId.
async function resolveTarget(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const requested = String(formData.get("targetUserId") ?? "");
  if (session.role === "admin" && requested) {
    return { session, targetId: requested };
  }
  return { session, targetId: session.id };
}

function pathFor(targetId: string, session: { id: string; role: string }) {
  return session.role === "admin" && targetId !== session.id
    ? `/admin/workers/${targetId}`
    : "/dashboard";
}

// ---- Work entries ----

export async function addWorkEntry(formData: FormData): Promise<void> {
  const { session, targetId } = await resolveTarget(formData);
  const date = String(formData.get("date") ?? "");
  const hours = parseNum(formData.get("hours"));
  const address = String(formData.get("address") ?? "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;
  if (!date || isNaN(hours)) return;

  const entry = await prisma.workEntry.create({
    data: { userId: targetId, date: new Date(date), hours, address, photoUrl },
  });
  await audit(session.id, "work_entries", entry.id, "create", null, {
    date,
    hours,
    address,
    photoUrl,
  });
  revalidatePath(pathFor(targetId, session));
}

export async function deleteWorkEntry(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const entry = await prisma.workEntry.findUnique({ where: { id } });
  if (!entry) return;
  if (session.role !== "admin" && entry.userId !== session.id) return;

  await prisma.workEntry.delete({ where: { id } });
  await audit(session.id, "work_entries", id, "delete", {
    date: entry.date.toISOString().slice(0, 10),
    hours: entry.hours.toString(),
    address: entry.address,
  }, null);
  revalidatePath(pathFor(entry.userId, session));
}

// ---- Payments ----

export async function addPayment(formData: FormData): Promise<void> {
  const { session, targetId } = await resolveTarget(formData);
  const date = String(formData.get("date") ?? "");
  const amount = parseNum(formData.get("amount"));
  if (!date || isNaN(amount)) return;

  const pay = await prisma.payment.create({
    data: { userId: targetId, date: new Date(date), amount },
  });
  await audit(session.id, "payments", pay.id, "create", null, { date, amount });
  revalidatePath(pathFor(targetId, session));
}

export async function deletePayment(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const pay = await prisma.payment.findUnique({ where: { id } });
  if (!pay) return;
  if (session.role !== "admin" && pay.userId !== session.id) return;

  await prisma.payment.delete({ where: { id } });
  await audit(session.id, "payments", id, "delete", {
    date: pay.date.toISOString().slice(0, 10),
    amount: pay.amount.toString(),
  }, null);
  revalidatePath(pathFor(pay.userId, session));
}

// ---- Rate & workers (admin) ----

export async function setHourlyRate(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const targetId = String(formData.get("targetUserId") ?? session.id);
  // Workers may only change their own rate; admins may change anyone's.
  if (session.role !== "admin" && targetId !== session.id) return;
  const rate = parseNum(formData.get("rate"));
  if (isNaN(rate)) return;

  await prisma.user.update({
    where: { id: targetId },
    data: { hourlyRate: rate },
  });
  revalidatePath(pathFor(targetId, session));
}

export async function setLocale(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = String(formData.get("locale") ?? "uk");
  const user = await prisma.user.update({
    where: { id: session.id },
    data: { locale },
  });
  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
  });
  revalidatePath("/", "layout");
}

export async function updateProfile(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: boolean }> {
  const session = await getSession();
  if (!session) redirect("/login");
  const requested = String(formData.get("targetUserId") ?? "");
  const isAdmin = session.role === "admin";
  const targetId = isAdmin && requested ? requested : session.id;

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const birthRaw = str("birthDate");

  // Fields any user may edit on their own record.
  const data: Record<string, unknown> = {
    phone: str("phone"),
    address: str("address"),
    nationality: str("nationality"),
    emergencyContact: str("emergencyContact"),
    photoUrl: str("photoUrl"),
    birthDate: birthRaw ? new Date(birthRaw) : null,
  };

  // Admin-only fields.
  if (isAdmin) {
    data.position = str("position");
    data.notes = str("notes");
    const status = String(formData.get("status") ?? "");
    if (["active", "on_leave", "terminated"].includes(status)) {
      data.status = status;
    }
  }

  await prisma.user.update({ where: { id: targetId }, data });
  revalidatePath(
    isAdmin && targetId !== session.id
      ? `/admin/workers/${targetId}`
      : "/dashboard/profile",
  );
  return { ok: true };
}

export async function createWorker(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rate = parseNum(formData.get("rate"));
  const position = String(formData.get("position") ?? "").trim() || null;
  if (!name || !email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "worker",
      hourlyRate: isNaN(rate) ? 0 : rate,
      position,
      locale: session.locale,
    },
  });
  revalidatePath("/admin");
}
