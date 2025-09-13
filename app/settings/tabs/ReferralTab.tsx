'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ReferralStats } from '../utils/types';

export default function ReferralTab() {
  const { user, getAccessToken } = usePrivy();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copyText, setCopyText] = useState('Copy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const tk = await getAccessToken();
        const res = await fetch('/api/referral/code', {
          headers: { Authorization: `Bearer ${tk}` },
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, getAccessToken]);

  const generateCode = async () => {
    const tk = await getAccessToken();
    const res = await fetch('/api/referral/code', { method: 'POST', headers: { Authorization: `Bearer ${tk}` } });
    if (res.ok) setStats(await res.json());
  };

  const copyLink = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.inviteLink);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-100">Referrals</h2>
        <p className="text-gray-100 text-sm mt-1">Generate your invite link and earn 10% from first offramp (stablecoin to fiat) transaction of referred users</p>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-100">Loading referral information...</p>
          </div>
        ) : !stats ? (
          <div className="text-center py-10">
            <button
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition-all"
              onClick={generateCode}
            >
              Generate Referral Code
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 font-medium">Your Invite Link</p>
                  <p className="text-sm text-blue-600 break-all">{stats.inviteLink}</p>
                </div>
                <button
                  className="ml-4 mb-8 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                  onClick={copyLink}
                >
                  {copyText}
                </button>
              </div>
              <a href="/dashboard/referrals" className="mt-8 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm">Click to view your Analytics</a>
            </div>

            <div>
              {/* <h3 className="text-gray-800 font-semibold mb-3">People You Invited</h3> */}
              {/* {stats.invitees.length === 0 ? (
                <p className="text-gray-500 text-sm">No invites yet.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email/Wallet</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volume (USD)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.invitees.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-2 text-sm text-gray-800 break-all">{inv.email || inv.wallet}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">${inv.volumeUsd.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )} */}
            </div>
          </div>
        )}
      </div>
    </>
  );
}