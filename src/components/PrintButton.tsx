"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-bold text-white"
    >
      🖨 {label}
    </button>
  );
}
