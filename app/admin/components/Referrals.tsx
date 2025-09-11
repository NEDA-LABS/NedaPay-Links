
'use client'
import useSWR from 'swr'
import Shell from '@/dashboard/referrals/components/Shell'
import { StatGrid, StatCard } from '@/dashboard/referrals/components/DataCards'
import { BarByCurrency } from '@/dashboard/referrals/components/Charts'
import { SimpleTable } from '@/dashboard/referrals/components/Tables'


const fetcher = (url: string) => fetch(url).then((r) => r.json())


export default function Referrals() {
const { data, isLoading, error } = useSWR('/api/referral/analytics/all', fetcher)
const totals = data?.totals || { influencers: 0, totalReferrals: 0, offrampTxCount: 0, offrampVolumeByCurrency: [] }


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


<SimpleTable
columns={[
{ key: 'influencer', header: 'Influencer' },
{ key: 'code', header: 'Code' },
{ key: 'email', header: 'Email' },
{ key: 'wallet', header: 'Wallet' },
{ key: 'referrals', header: 'Referrals' },
{ key: 'offrampTx', header: 'Off-ramp Tx' },
{ key: 'volumeByCurrency', header: 'Volume by Currency' }
]}
rows={data.rows}
/>
</>
)}
</Shell>
)
}