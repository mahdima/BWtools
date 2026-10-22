import type { SalesRow } from "@/lib/reports";
import { formatDA } from "@/lib/money";

// Sales per category or brand as a ranked list of horizontal bars (P7-02). One series,
// so one colour: bars grow from a shared left baseline, in proportion to the best row.
// Every value is printed as text, so the list doubles as its own table view.
export function SalesBarList({ title, description, rows }: { title: string; description: string; rows: SalesRow[] }) {
  const max = Math.max(...rows.map((row) => row.revenue), 0);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 p-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-gray-500">No sales in this period.</p>
      ) : (
        <ol className="space-y-1 p-4">
          {rows.map((row) => {
            const share = max > 0 ? (row.revenue / max) * 100 : 0;
            const units = `${row.quantity} ${row.quantity === 1 ? "unit" : "units"}`;
            return (
              <li
                key={`${row.id}-${row.label}`}
                title={`${row.label}: ${formatDA(row.revenue)} (${units})`}
                className="rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-gray-700">{row.label}</span>
                  <span className="shrink-0 font-medium tabular-nums text-gray-900">
                    {formatDA(row.revenue)}
                    <span className="ms-2 text-xs font-normal text-gray-500">{units}</span>
                  </span>
                </div>
                {/* Track in a light step of the bar's own hue; square at the baseline, 4px rounded at the data end */}
                <div className="h-2 w-full rounded-e bg-primary/10" aria-hidden>
                  <div className="h-2 rounded-e bg-primary" style={{ width: `${Math.max(share, 1)}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
