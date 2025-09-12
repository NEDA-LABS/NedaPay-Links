// /components/DataCards.tsx
'use client'

export const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
export const money = (n: number, currency = '') =>
`${fmt.format(n)}${currency ? ' ' + currency : ''}`


type StatCardProps = { label: string; value: number | string; hint?: string }


export function StatGrid({ children }: { children: React.ReactNode }) {
return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
}


export function StatCard({ label, value, hint }: StatCardProps) {
return (
<div className="card p-5 bg-[#111633] rounded-2xl shadow-lg border border-indigo-900/30">
<p className="text-sm text-[color:var(--muted)]">{label}</p>
<p className="mt-2 text-2xl text-white">{typeof value === 'number' ? fmt.format(value) : value}</p>
{hint && <p className="mt-1 text-xs text-[color:var(--muted)]">{hint}</p>}
</div>
)
}


export function VolumePill({ amount, currency }: { amount: number; currency: string }) {
return (
<span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-[#171c3f] border border-indigo-800/40">
<span className="font-semibold">{currency}</span>
<span>{money(amount)}</span>
</span>
)
}