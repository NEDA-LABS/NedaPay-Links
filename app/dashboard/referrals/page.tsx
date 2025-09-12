// /app/(dashboard)/influencer/analytics/page.tsx
"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Shell from "@/dashboard/referrals/components/Shell";
import { StatGrid, StatCard } from "@/dashboard/referrals/components/DataCards";
import { BarByCurrency, PieByStatus } from "@/dashboard/referrals/components/Charts";
import { usePrivy } from "@privy-io/react-auth";

export default function Page() {
  const { getAccessToken } = usePrivy();

  const fetcher = async (url: string) => {
    const token = await getAccessToken();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.json();
  };

  const { data, isLoading, error } = useSWR(
    "/api/referral/analytics/influencer",
    fetcher
  );

  const referralsCount = data?.referralsCount ?? 0;
  const txCount = data?.totals?.txCount ?? 0;
  const txVolumeByCurrency = data?.totals?.txVolumeByCurrency ?? [];
  const statusBreakdown = data?.totals?.statusBreakdown ?? [];
  const earningsByCurrency = data?.earningsByCurrency ?? [];
  const rows = data?.referredUsers ?? [];

  // ---------- Filters ----------
  const [q, setQ] = useState("");
  const [currency, setCurrency] = useState<string>("ALL");
  const [onlyWithEarnings, setOnlyWithEarnings] = useState(false);
  const [settledFilter, setSettledFilter] = useState<"ALL" | "SETTLED">("ALL");

  const currencyOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r: any) => {
      if (r.firstSettledTx?.currency) set.add(r.firstSettledTx.currency);
    });
    // also include currencies seen in totals volume (in case no settled yet)
    txVolumeByCurrency.forEach((c: any) => set.add(c.currency));
    return ["ALL", ...Array.from(set).sort()];
  }, [rows, txVolumeByCurrency]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      // search by wallet/email
      const text = `${r.wallet ?? ""} ${r.email ?? ""}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;

      // currency filter applies to first settled tx currency and/or earning currency
      if (currency !== "ALL") {
        const c1 = r.firstSettledTx?.currency === currency;
        const c2 = r.earning?.currency === currency;
        if (!c1 && !c2) return false;
      }

      // settled filter: has (or not) a first settled tx
      if (settledFilter === "SETTLED" && !r.firstSettledTx) return false;

      // earnings toggle
      if (onlyWithEarnings && !r.earning) return false;

      return true;
    });
  }, [rows, q, currency, onlyWithEarnings, settledFilter]);

  const totalEarningsDisplay = useMemo(() => {
    if (!earningsByCurrency?.length) return "0";
    return earningsByCurrency
      .map((e: any) => `${formatCCY(e.total)} ${e.currency}`)
      .join(" · ");
  }, [earningsByCurrency]);

  return (
    <div className="rounded-2xl">
      <Shell title="Referrals Analytics">
        {error && (
          <div className="card p-4 text-red-400 overflow-x-auto">
            {String(error)}
          </div>
        )}
        {isLoading && <div className="card p-4">Loading…</div>}
        {data && (
          <>
            {/* Top stats */}
            <StatGrid>
              <StatCard label="Referrals" value={referralsCount} />
              <StatCard label="Total Off-ramp Tx" value={txCount} />
              <StatCard
                label="Total Earnings"
                value={totalEarningsDisplay}
              />
              <StatCard
                label="Profile Active"
                value={data.influencer?.isActive ? "Yes" : "No"}
              />
            </StatGrid>

            {/* Charts */}
            {/* {txVolumeByCurrency.length > 0 || statusBreakdown.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-4 mt-6">
                {txVolumeByCurrency.length > 0 && (
                  <BarByCurrency data={txVolumeByCurrency} />
                )}
                {statusBreakdown.length > 0 && (
                  <PieByStatus data={statusBreakdown} />
                )}
              </div>
            ) : null} */}

            {/* Filters */}
            <div className="card mt-8 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Search (wallet or email)</label>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="0xabc... or user@email.com"
                    className="input input-bordered bg-transparent border-white/10 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Currency</label>
                  <select
                    className="bg-transparent border border-white/10 rounded-xl px-3 py-2"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {currencyOptions.map((c) => (
                      <option className="bg-neutral-900" key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Settled</label>
                  <select
                    className="bg-transparent border border-white/10 rounded-xl px-3 py-2"
                    value={settledFilter}
                    onChange={(e) => setSettledFilter(e.target.value as any)}
                  >
                    <option className="bg-neutral-900" value="ALL">All</option>
                    <option className="bg-neutral-900" value="SETTLED">Has settled</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyWithEarnings}
                      onChange={(e) => setOnlyWithEarnings(e.target.checked)}
                      className="accent-white/80"
                    />
                    Only with earnings
                  </label>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="py-2 pr-3">Wallet</th>
                    {/* <th className="py-2 pr-3">Email</th> */}
                    <th className="py-2 pr-3">Referred At</th>
                    {/* <th className="py-2 pr-3">First Settled Tx</th> */}
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Currency</th>
                    {/* <th className="py-2 pr-3">Status</th> */}
                    <th className="py-2">Earning (10%)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => (
                    <tr key={r.referralId} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-mono break-all">{r.wallet ? shortId(r.wallet) : "—"}</td>
                      {/* <td className="py-2 pr-3 font-mono break-all">{r.email ? shortId(r.email.split('@')[0]) + '@' + r.email.split('@')[1] : "—"}</td> */}
                      <td className="py-2 pr-3">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                      </td>
                      {/* <td className="py-2 pr-3 font-mono">
                        {r.firstSettledTx?.id ? shortId(r.firstSettledTx.id) : "—"}
                      </td> */}
                      <td className="py-2 pr-3">
                        {r.firstSettledTx ? formatCCY(r.firstSettledTx.amount) : "—"}
                      </td>
                      <td className="py-2 pr-3">{r.firstSettledTx?.currency || "—"}</td>
                      {/* <td className="py-2 pr-3">{r.firstSettledTx?.status || "—"}</td> */}
                      <td className="py-2 font-semibold">
                        {r.earning
                          ? `${formatCCY(r.earning.amount)} ${r.earning.currency}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td className="py-6 text-center text-gray-500" colSpan={8}>
                        No referrals match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Shell>
    </div>
  );
}

function shortId(id: string, n = 6) {
  if (!id) return "";
  if (id.length <= 2 * n) return id;
  return `${id.slice(0, n)}…${id.slice(-n)}`;
}
function formatCCY(amount: number) {
  if (!Number.isFinite(amount)) return "0.000000";
  return amount.toFixed(6);
}
