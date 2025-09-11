// /app/(dashboard)/influencer/analytics/page.tsx
"use client";
import useSWR from "swr";
import Shell from "@/dashboard/referrals/components/Shell";
import { StatGrid, StatCard } from "@/dashboard/referrals/components/DataCards";
import {
  BarByCurrency,
  PieByStatus,
} from "@/dashboard/referrals/components/Charts";
import { SimpleTable } from "@/dashboard/referrals/components/Tables";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

export default function Page() {
  const { user, getAccessToken } = usePrivy();

  const fetcher = async (url: string) => {
    const token = await getAccessToken(); // or your preferred way to get the token
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
  };

  const { data, isLoading, error } = useSWR(
    "/api/referral/analytics/influencer",
    fetcher
  );

  const referralsCount = data?.referralsCount ?? 0;
  const txCount = data?.totals?.txCount ?? 0;
  const txVolumeByCurrency = data?.totals?.txVolumeByCurrency ?? [];
  const statusBreakdown = data?.totals?.statusBreakdown ?? [];

  return (
    <Shell title="Referrals Analytics">
      {error && <div className="card p-4 text-red-400">{String(error)}</div>}
      {isLoading && <div className="card p-4">Loading…</div>}
      {data && (
        <>
          <StatGrid>
            <StatCard
              label="Referrals"
              value={referralsCount}
              hint="Counted by your referral code"
            />
            <StatCard
              label="Total Transactions"
              value={txCount}
              hint="Across all referred wallets"
            />
            <StatCard label="Currencies" value={txVolumeByCurrency.length} />
            <StatCard
              label="Profile Active"
              value={data.influencer?.isActive ? "Yes" : "No"}
            />
          </StatGrid>

          {txVolumeByCurrency.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <BarByCurrency data={txVolumeByCurrency} />
              <PieByStatus data={statusBreakdown} />
            </div>
          )}

          <SimpleTable
            columns={[
              { key: "wallet", header: "Referred Wallet" },
              { key: "createdAt", header: "Referred At" },
            ]}
            rows={data.referredUsers}
          />
        </>
      )}
    </Shell>
  );
}
