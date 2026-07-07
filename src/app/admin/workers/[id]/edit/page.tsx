import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import ProfileForm from "@/components/ProfileForm";
import DeleteWorkerButton from "@/components/DeleteWorkerButton";

export const dynamic = "force-dynamic";

export default async function EditWorkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const t = getDict(session.locale);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#eef1f5]">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-brand-dark px-4 py-3 text-white shadow-header">
        <Link
          href={`/admin/workers/${id}`}
          className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
        >
          ← {t.back}
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{t.editProfile}</h1>
          <div className="truncate text-xs opacity-80">{user.name}</div>
        </div>
      </header>

      <div className="p-4">
        <ProfileForm
          t={t}
          isAdmin
          targetUserId={user.id}
          values={{
            photoUrl: user.photoUrl ?? "",
            phone: user.phone ?? "",
            address: user.address ?? "",
            birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
            nationality: user.nationality ?? "",
            emergencyContact: user.emergencyContact ?? "",
            position: user.position ?? "",
            status: user.status,
            notes: user.notes ?? "",
          }}
        />

        <div className="mt-6 border-t border-brand-line pt-4">
          <DeleteWorkerButton
            id={user.id}
            label={t.deleteWorker}
            confirmText={t.deleteWorkerConfirm}
          />
        </div>
      </div>
    </div>
  );
}
