'use client'

import * as React from 'react'
import useSWR from 'swr'

type Props = {
  code: string | null
  open: boolean
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCCY(amount: number) {
  return Number.isFinite(amount) ? amount.toFixed(6) : '0.000000'
}

export default function InfluencerDetailsModal({ code, open, onClose }: Props) {
  const { data, isLoading, error } = useSWR(
    open && code ? `/api/referral/analytics/${encodeURIComponent(code)}` : null,
    fetcher
  )

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-[101] w-[95vw] md:w-[900px] max-h-[85vh] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="font-semibold">Influencer Details</div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(85vh - 52px)' }}>
          {error && <div className="card p-3 text-red-400">Failed to load: {String(error)}</div>}
          {isLoading && <div className="card p-3">Loading…</div>}

          {!isLoading && data && (
            <>
              <div className="grid gap-3 md:grid-cols-3 mb-6">
                <div className="card p-3">
                  <div className="text-xs text-gray-400">Influencer</div>
                  <div className="font-semibold">{data.influencer.displayName}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs text-gray-400">Code</div>
                  <div className="font-mono">{data.influencer.code}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs text-gray-400">Wallet</div>
                  <div className="font-mono break-all">{data.influencer.wallet || '—'}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 mb-6">
                <div className="card p-3">
                  <div className="text-xs text-gray-400">Referrals</div>
                  <div className="text-xl font-semibold">{data.totals.referrals}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs text-gray-400">Total Off-ramp Tx</div>
                  <div className="text-xl font-semibold">{data.totals.totalTx}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs text-gray-400">Total Earnings</div>
                  <div className="text-sm font-semibold">
                    {data.totals.totalEarningsByCurrency.length
                      ? data.totals.totalEarningsByCurrency
                          .map((e: any) => `${formatCCY(e.total)} ${e.currency}`)
                          .join(' · ')
                      : '0'}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3">Referrals</h3>
              <div className="space-y-4">
                {data.referrals.length === 0 && (
                  <div className="card p-4">No referrals yet.</div>
                )}

                {data.referrals.map((r: any) => (
                  <div key={r.referralId} className="card p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="text-sm text-gray-500">User</div>
                        <div className="font-mono">
                          {r.user.email || '—'} {r.user.name ? `(${r.user.name})` : ''}
                        </div>
                        <div className="text-xs text-gray-400 break-all">
                          Wallet: {r.user.wallet || '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Earning (10% of first settled)
                        </div>
                        <div className="font-semibold">
                          {r.earning
                            ? `${formatCCY(r.earning.amount)} ${r.earning.currency}`
                            : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="py-2 pr-3">Tx ID</th>
                            <th className="py-2 pr-3">Created</th>
                            <th className="py-2 pr-3">Amount</th>
                            <th className="py-2 pr-3">Currency</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2">First Settled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.transactions.map((t: any) => (
                            <tr key={t.id} className="border-t border-gray-800/40">
                              <td className="py-2 pr-3 font-mono">{t.id}</td>
                              <td className="py-2 pr-3">{new Date(t.createdAt).toLocaleString()}</td>
                              <td className="py-2 pr-3">{formatCCY(t.amount)}</td>
                              <td className="py-2 pr-3">{t.currency}</td>
                              <td className="py-2 pr-3">{t.status}</td>
                              <td className="py-2">
                                {r.firstSettled && r.firstSettled.id === t.id ? '✓' : ''}
                              </td>
                            </tr>
                          ))}
                          {r.transactions.length === 0 && (
                            <tr>
                              <td className="py-2 text-gray-500" colSpan={6}>
                                No off-ramp transactions.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
