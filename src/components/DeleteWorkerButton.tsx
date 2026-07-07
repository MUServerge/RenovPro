"use client";

import { deleteWorker } from "@/lib/actions";

export default function DeleteWorkerButton({
  id,
  label,
  confirmText,
}: {
  id: string;
  label: string;
  confirmText: string;
}) {
  return (
    <form
      action={deleteWorker}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="w-full rounded-xl border border-brand-danger bg-white py-3 font-bold text-brand-danger"
      >
        🗑 {label}
      </button>
    </form>
  );
}
