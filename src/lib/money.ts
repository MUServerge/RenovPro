// Decimal-safe helpers, ported from the original prototype's `num`/`eur` logic.
// Accepts both comma and period as the decimal separator (e.g. "12,5" -> 12.5).

export function parseNum(v: unknown): number {
  if (v === null || v === undefined) return NaN;
  return parseFloat(String(v).replace(",", "."));
}

export function eur(n: number): string {
  return (
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

// Trim trailing ".00" for compact hour display: 8 -> "8", 7.5 -> "7.5".
export function fmtHours(n: number): string {
  return (n % 1 ? n.toFixed(n % 1 === 0.5 ? 1 : 2) : n.toFixed(0)) + " г";
}

export function fmtDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Prisma Decimal fields come back as objects with a .toString(); normalise to number.
export function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v));
}
