// /components/Tables.tsx
"use client";
import { VolumePill } from "./DataCards";

export function SimpleTable({
  rows,
  columns,
}: {
  rows: any[];
  columns: { key: string; header: string }[];
}) {
  return (
    <div className="card p-4 overflow-x-auto bg-[#111633] rounded-2xl shadow-lg border border-indigo-900/30">
      <table className="min-w-full text-sm">
        <thead className="text-left text-[color:var(--muted)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-6 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-indigo-900/30">
              {columns.map((c) => (
                <td key={c.key} className="py-2 pr-6">
                  {Array.isArray(r[c.key]) ? (
                    <div className="flex flex-wrap gap-2">
                      {r[c.key].map((x: any, idx: number) => (
                        <VolumePill
                          key={idx}
                          amount={x.total}
                          currency={x.currency}
                        />
                      ))}
                    </div>
                  ) : (
                    String(r[c.key] ?? "")
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
