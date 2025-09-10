'use client';

import { usePrivy } from '@privy-io/react-auth';
import useSumsub from '@/hooks/useSumsub'; 
import { useKycStatus } from '@/hooks/useKycStatus'; 
import { useState, useEffect } from 'react';

export default function KycTab() {
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  // keep the same console log you had
  const { kycStatus } = useSumsub();
  console.log('kycStatus', kycStatus);

  // local state mirrored from original component
  const [isKycSubmitted, setIsKycSubmitted] = useState(false);

  // identical fetch you used inside SettingsPage
  useEffect(() => {
    if (!address) return;
    const checkKycStatus = async () => {
      try {
        const res = await fetch(`/api/kyc/submit?wallet=${address}`);
        if (!res.ok) throw new Error('Failed to check KYC status');
        const data = await res.json();
        setIsKycSubmitted(data.isSubmitted);
      } catch (err) {
        console.error('Error checking KYC status:', err);
      }
    };
    checkKycStatus();
  }, [address]);

  // UI copy-pasted from original commented block
  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-slate-200">KYC Verification</h2>
        <p className="text-gray-200 text-sm mt-1">Complete identity verification to access all features</p>
      </div>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify Your Identity</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  To comply with financial regulations and unlock all platform features, please complete our identity verification process.
                  This typically takes less than 5 minutes.
                </p>
                {kycStatus === 'approved' ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-blue-600 font-medium">Verification Completed</span>
                  </div>
                ) : kycStatus === 'pending' ? (
                  <a
                    href=""
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                  >
                    Submitted: Pending
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                ) : (
                  <a
                    href="/verification"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                  >
                    Verify Your Identity
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}