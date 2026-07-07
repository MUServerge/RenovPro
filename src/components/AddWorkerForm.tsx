"use client";

import { useRef } from "react";
import { createWorker } from "@/lib/actions";
import type { Dict } from "@/lib/i18n/dictionaries";

export default function AddWorkerForm({ t }: { t: Dict }) {
  const ref = useRef<HTMLFormElement>(null);
  const cls =
    "w-full rounded-xl border border-brand-line p-3 text-base outline-none focus:border-brand-med";

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await createWorker(fd);
        ref.current?.reset();
      }}
      className="grid grid-cols-1 gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-card sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-muted">
          {t.name}
        </label>
        <input name="name" required className={cls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-muted">
          {t.email}
        </label>
        <input name="email" type="email" required className={cls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-muted">
          {t.password}
        </label>
        <input name="password" type="text" required className={cls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-muted">
            {t.rate}
          </label>
          <input name="rate" type="text" inputMode="decimal" defaultValue="10" className={cls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-muted">
            {t.position}
          </label>
          <input name="position" className={cls} />
        </div>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-dark py-3 font-bold text-white sm:w-auto sm:px-8"
        >
          {t.createWorker}
        </button>
      </div>
    </form>
  );
}
