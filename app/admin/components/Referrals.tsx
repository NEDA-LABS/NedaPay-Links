'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Shell from '@/dashboard/referrals/components/Shell'
import { StatGrid, StatCard } from '@/dashboard/referrals/components/DataCards'
// import { BarByCurrency } from '@/dashboard/referrals/components/Charts'
import InfluencerDetailsModal from './InfluencerDetailsModal'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCurrencyList(arr: Array<{ currency: string; total: number }>) {
  if (!arr?.length) return '—'
  return arr.map((x) => `${x.total} ${x.currency}`).join(' · ')
}

export default function Referrals() {
  const { data, isLoading, error } = useSWR('/api/referral/analytics/all', fetcher)
  const totals =
    data?.totals || { influencers: 0, totalReferrals: 0, offrampTxCount: 0, offrampVolumeByCurrency: [] }

  const rows = useMemo(() => data?.rows || [], [data])

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openDetails = (code: string) => {
    setSelectedCode(code)
    setModalOpen(true)
  }

  return (
    <Shell title="Admin – Influencer Analytics">
      {error && <div className="card p-4 text-red-400">{String(error)}</div>}
      {isLoading && <div className="card p-4">Loading…</div>}

      {data && (
        <>
          <StatGrid>
            <StatCard label="Influencers" value={totals.influencers} />
            <StatCard label="Total Referrals" value={totals.totalReferrals} />
            {/* <StatCard label="Off-ramp Tx" value={totals.offrampTxCount} />
            <StatCard label="Currencies" value={totals.offrampVolumeByCurrency.length} /> */}
          </StatGrid>

          {/* <BarByCurrency data={totals.offrampVolumeByCurrency} /> */}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-2 pr-3">Influencer</th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Wallet</th>
                  <th className="py-2 pr-3">Referrals</th>
                  <th className="py-2 pr-3">Off-ramp Tx</th>
                  <th className="py-2">Volume by Currency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.code} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 pr-3">
                      <button
                        className="underline decoration-dotted hover:decoration-solid hover:text-white/90"
                        onClick={() => openDetails(r.code)}
                        title="View influencer details"
                      >
                        {r.influencer}
                      </button>
                    </td>
                    <td className="py-2 pr-3 font-mono">{r.code}</td>
                    <td className="py-2 pr-3 font-mono">{r.email || '—'}</td>
                    <td className="py-2 pr-3 font-mono break-all">{r.wallet || '—'}</td>
                    <td className="py-2 pr-3">{r.referrals}</td>
                    <td className="py-2 pr-3">{r.offrampTx}</td>
                    <td className="py-2">{formatCurrencyList(r.volumeByCurrency)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan={7}>
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <InfluencerDetailsModal
            code={selectedCode}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </>
      )}
    </Shell>
  )
}
