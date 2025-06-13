'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchTokenRate, fetchSupportedInstitutions, verifyAccount, fetchSupportedCurrencies } from '../utils/paycrest';

const PaymentForm: React.FC = () => {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState('');
  const [fiat, setFiat] = useState('NGN');
  const [rate, setRate] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [accountName, setAccountName] = useState('');
  const [memo, setMemo] = useState('');
  const [institutions, setInstitutions] = useState<Array<{ name: string; code: string; type: string }>>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string; shortName: string; decimals: number; symbol: string; marketRate: string }>>([]);

  const fetchInstitutions = async () => {
    try {
      const data = await fetchSupportedInstitutions(fiat);
      setInstitutions(data);
    } catch (err) {
      setError('Failed to fetch institutions');
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const data = await fetchSupportedCurrencies();
      setCurrencies(data);
    } catch (err) {
      setError('Failed to fetch currencies');
    }
  };

  const handleVerifyAccount = async () => {
    try {
      const name = await verifyAccount(institution, accountIdentifier);
      setAccountName(name === 'OK' ? '' : name);
      setError('');
    } catch (err) {
      setError('Account verification failed');
    }
  };

  const handleFetchRate = async () => {
    try {
      const fetchedRate = await fetchTokenRate('USDC', parseFloat(amount), fiat);
      setRate(fetchedRate);
      setError('');
    } catch (err) {
      setError('Failed to fetch rate');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      login();
      return;
    }

    const wallet = wallets.find((w) => w.chainId === 'eip155:8453'); // Base network
    if (!wallet) {
      setError('No wallet connected on Base network');
      return;
    }

    try {
      const response = await axios.post('/api/paycrest/orders', {
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        network: 'base',
        token: 'USDC',
        recipient: {
          institution,
          accountIdentifier,
          accountName: accountName || 'Unknown',
          memo,
        },
        returnAddress: wallet.address,
        reference: `order-${Date.now()}`,
      });

      setSuccess(`Payment order initiated! Receive address: ${response.data.data.receiveAddress}`);
      setError('');
    } catch (err) {
      setError('Failed to initiate payment order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-2 px-4 py-2 !bg-white/80 !backdrop-blur-sm !border !border-gray-200 !rounded-xl hover:!bg-white hover:!shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span> 
          Back
        </button>
      </div>
  
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/30 to-blue-200/30 blur-3xl rounded-4xl"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium animate-pulse">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
            </svg>
            Crypto to Fiat Offramp
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Convert Crypto to Cash
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Seamlessly convert your USDC to local currency with instant bank transfers.
          </p>
        </div>
  
        {/* Authentication Status */}
        {!authenticated && (
          <div className="mb-8 p-6 rounded-2xl border-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Authentication Required</h3>
                <p className="text-amber-700 text-sm mt-1">Please login to access the offramp service</p>
              </div>
              <button 
                onClick={login} 
                className="px-6 py-3 !bg-gradient-to-r !from-blue-600 !to-blue-500 hover:!from-blue-700 hover:!to-blue-600 !text-white !font-semibold !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Login with Privy
              </button>
            </div>
          </div>
        )}
  
        {/* Main Form Card */}
        {authenticated && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 mb-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Initiate Offramp Payment</h2>
              <p className="text-gray-600">Convert your crypto to fiat and receive funds directly in your bank account</p>
            </div>
  
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div className="group">
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-3">
                  Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="0.00"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                    <span className="text-gray-500 font-medium">USDC</span>
                  </div>
                </div>
              </div>
  
              {/* Fiat Currency Selection */}
              <div className="group">
                <label htmlFor="fiat" className="block text-sm font-semibold text-gray-700 mb-3">
                  Fiat Currency
                </label>
                <div className="relative">
                  <select
                    id="fiat"
                    value={fiat}
                    onChange={(e) => { setFiat(e.target.value); fetchInstitutions(); }}
                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
  
              {/* Exchange Rate Section */}
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Exchange Rate</label>
                  <button
                    type="button"
                    onClick={handleFetchRate}
                    className="px-4 py-2 !bg-emerald-500 hover:!bg-emerald-600 !text-white !rounded-xl !font-medium transition-all duration-300 text-sm"
                  >
                    Fetch Rate
                  </button>
                </div>
                {rate && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-emerald-800 font-medium">
                      1 USDC = {rate} {fiat}
                    </p>
                  </div>
                )}
              </div>
  
              {/* Institution Selection */}
              <div className="group">
                <label htmlFor="institution" className="block text-sm font-semibold text-gray-700 mb-3">
                  Bank Institution
                </label>
                <div className="relative">
                  <select
                    id="institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    onFocus={fetchInstitutions}
                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                    required
                  >
                    <option value="">Select Bank Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst.code} value={inst.code}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
  
              {/* Account Number */}
              <div className="group">
                <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-3">
                  Account Number
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    id="accountNumber"
                    value={accountIdentifier}
                    onChange={(e) => setAccountIdentifier(e.target.value)}
                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your account number"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAccount}
                    className="px-6 py-3 !bg-blue-500 hover:!bg-blue-600 !text-white !rounded-xl !font-medium transition-all duration-300"
                  >
                    Verify Account
                  </button>
                  {accountName && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-800 font-medium">
                        Account Verified: {accountName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
  
              {/* Memo */}
              <div className="group">
                <label htmlFor="memo" className="block text-sm font-semibold text-gray-700 mb-3">
                  Transaction Memo
                </label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                  rows={3}
                  placeholder="Add a memo for this transaction..."
                  required
                />
              </div>
  
              {/* Error and Success Messages */}
              {error && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 animate-fade-in">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}
  
              {success && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 animate-fade-in">
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              )}
  
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 px-8 !bg-gradient-to-r !from-emerald-600 !to-blue-600 hover:!from-emerald-700 hover:!to-blue-700 !text-white !font-semibold text-lg !rounded-2xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Initiate Offramp Payment
                </div>
              </button>
            </form>
          </div>
        )}
  
        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Fast Processing</h3>
            </div>
            <p className="text-gray-600 text-sm">Receive funds in your bank account within minutes of transaction completion.</p>
          </div>
  
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Secure Transfers</h3>
            </div>
            <p className="text-gray-600 text-sm">Bank-grade security with encrypted transactions and verified account validation.</p>
          </div>
  
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Best Rates</h3>
            </div>
            <p className="text-gray-600 text-sm">Competitive exchange rates with transparent pricing and minimal fees.</p>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
  
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
  
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;