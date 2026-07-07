"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions";
import type { Dict } from "@/lib/i18n/dictionaries";

export type ProfileValues = {
  photoUrl: string;
  phone: string;
  address: string;
  birthDate: string; // YYYY-MM-DD or ""
  nationality: string;
  emergencyContact: string;
  position: string;
  status: string;
  notes: string;
};

const input =
  "w-full rounded-xl border border-brand-line p-3 text-base outline-none focus:border-brand-med";

export default function ProfileForm({
  t,
  values,
  isAdmin = false,
  targetUserId,
}: {
  t: Dict;
  values: ProfileValues;
  isAdmin?: boolean;
  targetUserId?: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, {});

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-brand-line bg-white p-4 shadow-card"
    >
      {targetUserId && (
        <input type="hidden" name="targetUserId" value={targetUserId} />
      )}

      {values.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={values.photoUrl}
          alt=""
          className="mb-3 h-20 w-20 rounded-full border border-brand-line object-cover"
        />
      )}

      <Field label={t.photoUrl}>
        <input name="photoUrl" defaultValue={values.photoUrl} className={input} placeholder="https://…" />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t.phone}>
          <input name="phone" defaultValue={values.phone} className={input} inputMode="tel" />
        </Field>
        <Field label={t.address}>
          <input name="address" defaultValue={values.address} className={input} />
        </Field>
        <Field label={t.birthDate}>
          <input name="birthDate" type="date" defaultValue={values.birthDate} className={input} />
        </Field>
        <Field label={t.nationality}>
          <input name="nationality" defaultValue={values.nationality} className={input} />
        </Field>
      </div>

      <Field label={t.emergencyContact}>
        <input name="emergencyContact" defaultValue={values.emergencyContact} className={input} />
      </Field>

      {isAdmin && (
        <div className="mt-1 rounded-xl bg-brand-light/50 p-3">
          <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.position}>
              <input name="position" defaultValue={values.position} className={input} />
            </Field>
            <Field label={t.status}>
              <select name="status" defaultValue={values.status || "active"} className={input}>
                <option value="active">{t.statusActive}</option>
                <option value="on_leave">{t.statusOnLeave}</option>
                <option value="terminated">{t.statusTerminated}</option>
              </select>
            </Field>
          </div>
          <Field label={t.notes}>
            <textarea name="notes" defaultValue={values.notes} rows={3} className={input} />
          </Field>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-dark px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          {t.save}
        </button>
        {state?.ok && (
          <span className="text-sm font-semibold text-[#2e8b57]">
            ✓ {t.profileSaved}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold text-brand-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
