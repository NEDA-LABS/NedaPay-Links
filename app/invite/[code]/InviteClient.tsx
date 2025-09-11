'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function InviteClient({
  influencer,
}: {
  influencer: { code: string; name: string; bonus: string };
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);

  // Route to dashboard when done
  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000); // 2 second delay to show success message
      return () => clearTimeout(timer);
    }
  }, [done, router]);

  // 1. After Privy login succeeds → claim the referral
  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    (async () => {
      setClaiming(true);
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          email: user?.email?.address,
          wallet: user?.wallet?.address,
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-slate-300 rounded-xl mb-4"></div>
            <p className="text-slate-300 text-lg">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        {/* <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,<svg> width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div> */}

        {/* Header */}
        <header className="relative z-10 px-6 py-8">
          <div className="flex items-center justify-center">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative flex">
                <div className="flex rounded-xl items-center justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 -p-[8px]">
                  <Image src="/logo.svg" alt="Logo" width={60} height={60} />
                </div>
                <div className="flex justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <span className="text-sm relative z-10 text-slate-100 font-extrabold drop-shadow-lg p-1 hidden md:!flex items-center -ml-4">
                    NEDAPay
                  </span>
                </div>
                <span className="absolute -right-3 text-[0.6rem] z-10 text-slate-100 font-bold flex items-center justify-center ring-1 ring-slate-100 rounded-sm">
                  BETA
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center px-6 pb-20">
          <div className="max-w-md w-full">
            {/* Invitation Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  You've Been Invited!
                </h1>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Join NEDAPay and unlock exclusive benefits with your special invitation
                </p>
              </div>

              {/* Influencer Info */}
              {/* <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {influencer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Invited by {influencer.name}</p>
                    <p className="text-slate-400 text-sm">Bonus: {influencer.bonus}</p>
                  </div>
                </div>
              </div> */}

              {/* CTA Button */}
              <button
                onClick={login}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Sign Up with Email or Wallet
              </button>

              {/* Security Note */}
              <div className="flex items-center justify-center space-x-2 mt-6 text-slate-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span>Secured by Privy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (claiming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        
        {/* Header */}
        <header className="relative z-10 px-6 py-8">
          <div className="flex items-center justify-center">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative flex">
                <div className="flex rounded-xl items-center justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 -p-[8px]">
                  <Image src="/logo.svg" alt="Logo" width={60} height={60} />
                </div>
                <div className="flex justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <span className="text-sm relative z-10 text-slate-100 font-extrabold drop-shadow-lg p-1 hidden md:!flex items-center -ml-4">
                    NEDAPay
                  </span>
                </div>
                <span className="absolute -right-3 text-[0.6rem] z-10 text-slate-100 font-bold flex items-center justify-center ring-1 ring-slate-100 rounded-sm">
                  BETA
                </span>
              </div>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
              <p className="text-slate-300">Finalizing your bonus…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        
        {/* Header */}
        <header className="relative z-10 px-6 py-8">
          <div className="flex items-center justify-center">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative flex">
                <div className="flex rounded-xl items-center justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 -p-[8px]">
                  <Image src="/logo.svg" alt="Logo" width={60} height={60} />
                </div>
                <div className="flex justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <span className="text-sm relative z-10 text-slate-100 font-extrabold drop-shadow-lg p-1 hidden md:!flex items-center -ml-4">
                    NEDAPay
                  </span>
                </div>
                <span className="absolute -right-3 text-[0.6rem] z-10 text-slate-100 font-bold flex items-center justify-center ring-1 ring-slate-100 rounded-sm">
                  BETA
                </span>
              </div>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to NEDAPay!</h2>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-slate-300">
                  <span className="text-white font-semibold">Wallet:</span><br/>
                  <span className="font-mono text-sm break-all">{user?.wallet?.address}</span>
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-green-400 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Setup complete!</span>
              </div>
              <p className="text-slate-400 text-sm">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}