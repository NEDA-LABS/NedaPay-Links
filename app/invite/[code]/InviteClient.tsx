'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InviteClient({
  influencer,
}: {
  influencer: { code: string; name: string; bonus: string };
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);

  // 1. After Privy login succeeds → claim the referral
  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    (async () => {
      setClaiming(true);
      const res = await fetch('/api/claim-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          email: user.email,
          code: influencer.code,
          influencer: influencer.name,
          bonus: influencer.bonus,
        }),
      });

      if (res.ok) setDone(true);
      else console.error('Claim failed');
      setClaiming(false);
    })();
  }, [ready, authenticated, user, influencer]);

  if (!ready) return <p>Loading…</p>;

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-20">
        <h1 className="text-2xl font-bold mb-2">You have been invited!</h1>
        <p className="text-gray-600 mb-4">
          <span className="font-semibold">{influencer.name}</span> gives you{' '}
          <span className="font-semibold">{influencer.bonus}</span> when you join.
        </p>
        <button
          onClick={login}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continue with Privy
        </button>
      </div>
    );
  }

  if (claiming) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-20 text-center">
        <p>Finalising your bonus…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome {user?.email?.address}!</h2>
        <p className="text-green-700">Your {influencer.bonus} bonus is credited.</p>
      </div>
    );
  }

  return null;
}