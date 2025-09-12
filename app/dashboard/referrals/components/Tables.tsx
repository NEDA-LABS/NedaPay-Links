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
    <div className="card p-4 bg-[#111633] rounded-2xl shadow-lg border border-indigo-900/30 w-[300px] md:w-full">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full text-sm w-full table-auto">
        <thead className="text-left text-[color:var(--muted)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="py-2 px-4 sm:pr-6 font-medium whitespace-nowrap">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-indigo-900/30 text-white">
              {columns.map((c) => (
                <td key={c.key} className="py-2 px-4 sm:pr-6 whitespace-nowrap text-xs">
                  {Array.isArray(r[c.key]) ? (
                    <div className="flex flex-wrap gap-2 text-white">
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
    </div>
  );
}
