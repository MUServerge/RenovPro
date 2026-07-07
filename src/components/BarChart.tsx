// Lightweight, dependency-free bar chart (pure SVG, server-renderable).
// Palette matches the MaysterPRO brand.

export type Bar = { label: string; value: number; sub?: string };

export default function BarChart({
  data,
  unit = "",
  color = "#2E75B6",
  emptyText = "—",
}: {
  data: Bar[];
  unit?: string;
  color?: string;
  emptyText?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-brand-muted">{emptyText}</div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0);
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-20 shrink-0 truncate text-xs font-semibold text-brand-txt sm:w-28">
              {d.label}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-brand-light/60">
              <div
                className="h-full rounded-md"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-xs font-extrabold text-brand-dark sm:w-20">
              {formatValue(d.value)}
              {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatValue(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
