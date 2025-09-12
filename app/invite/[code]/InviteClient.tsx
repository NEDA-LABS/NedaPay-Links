'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function InviteClient({
  influencer,
}: {
  influencer: { code: string; name: string; bonus: string; email: string };
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);

  // Route to dashboard when done
  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [done, router]);

  // After Privy login succeeds → claim the referral
  useEffect(() => {
    if (!ready || !authenticated || !user || !user.wallet?.address) return;
    (async () => {
      setClaiming(true);
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          email: user?.email?.address,
          wallet: user?.wallet?.address || wallets[0].address,
          code: influencer.code,
          influencer: influencer.name,
          bonus: influencer.bonus,
        }),
      });
      if (res.ok) setDone(true);
      else {
        router.push('/');
        console.error('Claim failed')
      };
      setClaiming(false);
    })();
  }, [ready, authenticated, user, influencer, user?.wallet?.address, wallets]);

  // ---------- COMMON SHELL ----------
  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 relative overflow-hidden text-slate-100">
      {/* soft glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-indigo-700/20 blur-3xl" />

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="group inline-flex items-center gap-3">
          <Image src="/logo.svg" alt="NEDAPay" width={60} height={60} />
            <div className="relative -ml-4">
              
              <span className="text-xl font-extrabold tracking-tight text-slate-100">
              NEDAPay
            </span>
              <span className="absolute -right-3 -top-1 rounded-sm border border-slate-300/60 px-1 text-[10px] font-bold tracking-wide text-slate-200">
                BETA
              </span>
            </div>
            
          </Link>

          {!authenticated && (
            <button
              onClick={login}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-purple-500 hover:to-indigo-500"
            >
              Sign Up
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10">{children}</main>
    </div>
  );

  // ---------- LOADING ----------
  if (!ready) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="animate-pulse text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-slate-300/20" />
            <p className="text-slate-300">Loading…</p>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- UNAUTHED HERO (Invite Landing) ----------
  if (!authenticated) {
    return (
      <Shell>
        <section className="mx-auto grid min-h-[70vh] max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-2 ">
          {/* Left: Hero Text */}
          <div className="order-2 md:order-1">

            <h1 className="mt-4 text-2xl md:text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Send and Accept Stablecoins, Swap instantly, Cash Out Easily, Track Transactions
            </h1>

            {/* <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
              Seamless stablecoin transfers via WhatsApp, email, SMS, or any
              platform—no crypto knowledge required. Join with your invite and
              start sending in seconds.
            </p> */}

            {/* (Optional) influencer strip, subtle */}
            <div className="mt-6 w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">Invited by:</span>{' '}
                {influencer.email.split('@')[0]} •{' '}
                {/* <span className="text-slate-300">Bonus:</span>{' '} */}
                {/* <span className="font-medium text-white">{influencer.bonus}</span> */}
              </p>
            </div>

            <div className="mt-6 flex w-full max-w-md items-center gap-3">
              <button
                onClick={login}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              >
                Sign up with email or wallet
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Your data is private. Secured by Privy.</span>
            </div>
          </div>

          {/* Right: Device Mock */}
         
            
              <Image
                src="/coins.png" // <-- replace later
                alt="NEDAPay app preview"
                width={600}
                height={600}
                priority
                className="fixed -z-100 opacity-30 lg:right-0  xl:right-60"
              />
            
          
        </section>
      </Shell>
    );
  }

  // ---------- CLAIMING ----------
  if (claiming) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/80 border-b-transparent" />
            </div>
            <h2 className="text-2xl font-bold text-white">Processing…</h2>
            {/* <p className="mt-2 text-slate-300">Finalizing your bonus.</p> */}
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- DONE ----------
  if (done) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
              <svg
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white">Welcome to NEDAPay!</h2>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">Wallet</span>
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-200">
                {user?.wallet?.address}
              </p>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-emerald-400">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Setup complete! Redirecting…</span>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return null;
}
