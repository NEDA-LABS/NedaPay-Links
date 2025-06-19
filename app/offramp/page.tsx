'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import axios from 'axios';
import { ethers } from 'ethers';
import { Loader2, Network } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchTokenRate, fetchSupportedInstitutions, verifyAccount, fetchSupportedCurrencies } from '../utils/paycrest';

// USDC contract address on Base mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
];

const PaymentForm: React.FC = () => {
  const { authenticated, login, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState('');
  const [fiat, setFiat] = useState('NGN');
  const [rate, setRate] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memo, setMemo] = useState('');
  const [institutions, setInstitutions] = useState<Array<{ name: string; code: string; type: string }>>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string; shortName: string; decimals: number; symbol: string; marketRate: string }>>([]);
  const [isAccountVerified, setIsAccountVerified] = useState(false);

  // Get the active wallet
  const activeWallet = wallets.length > 0 ? wallets[0] : null;

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
      setIsLoading(true);
      const response = await verifyAccount(institution, accountIdentifier);
      if (response === 'OK' || typeof response === 'string') {
        setIsAccountVerified(true);
        setError('');
      } else {
        setError('Account verification failed');
      }
    } catch (err) {
      setError('Account verification failed');
    } finally {
      setIsLoading(false);
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

    if (!activeWallet) {
      setError('No wallet connected. Please connect a wallet first.');
      return;
    }

    if (!activeWallet.address) {
      setError('Wallet address not available. Please reconnect your wallet.');
      return;
    }

    if (!isAccountVerified) {
      setError('Please verify the account before proceeding.');
      return;
    }

    if (!rate) {
      setError('Please fetch the exchange rate before proceeding.');
      return;
    }

    try {
      setIsLoading(true);

      // Switch to Base network
      if (activeWallet.switchChain) {
        try {
          await activeWallet.switchChain(8453); // Base mainnet chain ID
        } catch (switchError) {
          console.warn('Could not switch to Base network:', switchError);
          setError('Failed to switch to Base network. Please ensure your wallet is on Base.');
          return;
        }
      }

      // Get wallet provider and signer
      const provider = new ethers.providers.Web3Provider(await activeWallet.getEthereumProvider());
      const signer = provider.getSigner();

      // Initiate payment order
      const response = await axios.post('/api/paycrest/orders', {
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        network: 'base',
        token: 'USDC',
        recipient: {
          institution,
          accountIdentifier,
          accountName,
          memo,
        },
        returnAddress: activeWallet.address,
        reference: `order-${Date.now()}`,
      });

      const { receiveAddress, amount: orderAmount, reference, senderFee, transactionFee, validUntil } = response.data.data;

      // Initialize USDC contract
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const decimals = await usdcContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      // Check wallet balance
      const balance = await usdcContract.balanceOf(activeWallet.address);
      if (balance.lt(amountInWei)) {
        setError('Insufficient USDC balance in your wallet.');
        return;
      }

      // Send USDC transaction
      const tx = await usdcContract.transfer(receiveAddress, amountInWei);
      await tx.wait();

      setSuccess(`Payment order initiated! \nReference: ${reference}\nAmount: ${orderAmount}\nNetwork: base\nToken: USDC\nFee: ${senderFee}\nTransaction Fee: ${transactionFee}\nValid Until: ${validUntil}`);
      setError('');
    } catch (err) {
      console.error('Payment order error:', err);
      if (axios.isAxiosError(err)) {
        setError(`Failed to initiate payment order: ${err.response?.data?.message || err.message}`);
      } else {
        setError('Failed to initiate payment order or send transaction');
      }
    } finally {
      setIsLoading(false);
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
            Stablecoins to Fiat Offramp
          </div>
          <h1 className="text-2xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Convert your Stablecoins to Cash
            </span>
          </h1>
          <p className="text-sm md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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

        {/* Wallet Connection Status */}
        {authenticated && !activeWallet && (
          <div className="mb-8 p-6 rounded-2xl border-2 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Wallet Connection Required</h3>
                <p className="text-orange-700 text-sm mt-1">Please connect a wallet to proceed with the offramp</p>
              </div>
              <button
                onClick={connectWallet}
                className="px-6 py-3 !bg-gradient-to-r !from-emerald-600 !to-emerald-500 hover:!from-emerald-700 hover:!to-emerald-600 !text-white !font-semibold !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Wallet Info */}
        {authenticated && activeWallet && (
          <div className="mb-8 p-6 rounded-2xl border-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Wallet Connected</h3>
                <p className="text-green-700 text-sm mt-1 font-mono">
                  {activeWallet.address?.slice(0, 6)}...{activeWallet.address?.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">Ready for Base Network</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        {authenticated && activeWallet && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 mb-12">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Initiate Offramp Payment</h2>
              <p className="text-gray-600">Follow the steps below to convert your USDC to fiat and receive funds in your bank or mobile account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Amount and Currency */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-3 py-1">Step 1</span>
                  <h3 className="text-sm font-semibold text-gray-900">Enter Amount and Currency</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
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
                        className="w-full px-6 py-4 text-sm rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="minimum 1 usdc"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                        <span className="text-gray-500 font-medium text-sm">USDC</span>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label htmlFor="fiat" className="block text-sm font-semibold text-gray-700 mb-3">
                      Fiat Currency
                    </label>
                    <div className="relative">
                      <select
                        id="fiat"
                        value={fiat}
                        onChange={(e) => { setFiat(e.target.value); fetchInstitutions(); setInstitution(''); setIsAccountVerified(false); }}
                        className="w-full px-6 py-4 text-sm rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                      >
                        <option value="">Select Currency</option>
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
                </div>
                <div className="group">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Exchange Rate</label>
                    <button
                      type="button"
                      onClick={handleFetchRate}
                      disabled={!amount || !fiat}
                      className="px-4 py-2 !bg-emerald-500 hover:!bg-emerald-600 !text-white !rounded-xl !font-medium transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Fetch Rate
                    </button>
                  </div>
                  {rate && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-3 animate-fade-in">
                      <p className="text-emerald-800 font-medium">
                        1 USDC = {rate} {fiat}
                      </p>
                      <p className="text-emerald-600 text-sm mt-1">
                        You will receive approximately {(parseFloat(amount) * parseFloat(rate)).toFixed(2)} {fiat}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Recipient Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-3 py-1">Step 2</span>
                  <h3 className="text-sm font-semibold text-gray-900">Recipient Details</h3>
                </div>
                <div className="group">
                  <label htmlFor="institution" className="block text-sm font-semibold text-gray-700 mb-3">
                    Choose Bank or Mobile Network
                  </label>
                  <div className="relative">
                    <select
                      id="institution"
                      value={institution}
                      onChange={(e) => { setInstitution(e.target.value); setIsAccountVerified(false); }}
                      onFocus={fetchInstitutions}
                      className="w-full px-6 py-4 text-sm rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                      required
                    >
                      <option value="">Select Institution</option>
                      {institutions.map((inst) => (
                        <option key={inst.code} value={inst.code}>
                          {inst.name} {inst.type === 'mobile' ? '(Mobile Network)' : '(Bank)'}
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
                <div className="group">
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-3">
                    Account or Mobile Number
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={accountIdentifier}
                    onChange={(e) => { setAccountIdentifier(e.target.value); setIsAccountVerified(false); }}
                    className="w-full px-6 py-4 text-sm rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter account or mobile number"
                    required
                  />
                  <p className="text-sm text-blue-400 mt-2">For mobile numbers include country code (e.g., +2341234567890).</p>
                </div>
                <div className="group">
                  <label htmlFor="accountName" className="block text-sm font-semibold text-gray-700 mb-3">
                    Account Name
                  </label>
                  <input
                    type="text"
                    id="accountName"
                    value={accountName}
                    onChange={(e) => { setAccountName(e.target.value); setIsAccountVerified(false); }}
                    className="w-full px-6 py-4 text-sm rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter the exact account holder's name"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">Ensure the name matches the account holder's name exactly.</p>
                </div>
                <div className="group">
                  <button
                    type="button"
                    onClick={handleVerifyAccount}
                    disabled={isLoading || !institution || !accountIdentifier || !accountName}
                    className={`w-full text-sm px-6 py-3 !bg-blue-500 hover:!bg-blue-600 !text-white !rounded-xl !font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      'Verify Account'
                    )}
                  </button>
                  {isAccountVerified && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 mt-3 animate-fade-in">
                      <p className="text-green-800 font-medium">Account Verified Successfully</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Transaction Memo */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-3 py-1">Step 3</span>
                  <h3 className="text-sm font-semibold text-gray-900">Transaction Description</h3>
                </div>
                <div className="group">
                  <label htmlFor="memo" className="block text-sm font-semibold text-gray-700 mb-3">
                    Transaction Memo
                  </label>
                  <textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full px-6 py-4 text-sm rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                    rows={3}
                    placeholder="Add a memo for this transaction..."
                    required
                  />
                </div>
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
              <div className="space-y-4">
              <span className="text-sm text-blue-400">make sure you have fetched rate and verified account before initiating payment</span>
                <button
                  type="submit"
                  disabled={isLoading || !rate || !isAccountVerified}
                  className="w-full py-4 px-8 !bg-gradient-to-r !from-emerald-600 !to-blue-600 hover:!from-emerald-700 hover:!to-blue-700 !text-white !font-semibold text-sm !rounded-2xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center gap-3">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                    {isLoading ? 'Processing...' : 'Initiate Offramp Payment'}
                  </div>
                </button>
                <p className="text-sm text-gray-600 text-center">
                  If the transaction fails, funds will be refunded to your wallet address.
                </p>
              </div>
            </form>
          </div>
        )}

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