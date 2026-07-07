import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/dictionaries";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

function isoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/login");

  const t = getDict(session.locale);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#eef1f5]">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-brand-dark px-4 py-3 text-white shadow-header">
        <Link
          href={session.role === "admin" ? "/admin" : "/dashboard"}
          className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
        >
          ← {t.back}
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{t.profile}</h1>
          <div className="truncate text-xs opacity-80">{user.name}</div>
        </div>
      </header>

      <div className="p-4">
        <ProfileForm
          t={t}
          isAdmin={false}
          values={{
            photoUrl: user.photoUrl ?? "",
            phone: user.phone ?? "",
            address: user.address ?? "",
            birthDate: isoDate(user.birthDate),
            nationality: user.nationality ?? "",
            emergencyContact: user.emergencyContact ?? "",
            position: user.position ?? "",
            status: user.status,
            notes: user.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
