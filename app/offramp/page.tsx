"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { usePrivy, useWallets, useSign7702Authorization } from '@privy-io/react-auth';
import axios from 'axios';
import { ethers } from 'ethers';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  fetchTokenRate, 
  fetchSupportedInstitutions, 
  verifyAccount, 
  fetchSupportedCurrencies 
} from '../utils/paycrest';
import { 
  initializeBiconomy as initializeBiconomyEmbedded,
  executeGasAbstractedTransfer as executeGasAbstractedTransferEmbedded,
  type BiconomyClient as BiconomyEmbeddedClient
} from '../utils/biconomyEmbedded';
import { 
  initializeBiconomy as initializeBiconomyExternal,
  executeGasAbstractedTransfer as executeGasAbstractedTransferExternal,
  type BiconomyClient as BiconomyExternalClient
} from '../utils/biconomyExternal';

import { WalletType } from '../utils/biconomyExternal';

import { base } from 'viem/chains';

// Constants
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
];

const PaymentForm: React.FC = () => {
  // Authentication and wallet state
  const { authenticated, login, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { signAuthorization } = useSign7702Authorization();
  
  // Form state
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
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string }>>([]);
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [biconomyEmbeddedClient, setBiconomyEmbeddedClient] = useState<BiconomyEmbeddedClient | null>(null);
  const [biconomyExternalClient, setBiconomyExternalClient] = useState<BiconomyExternalClient | null>(null);
  const [gasAbstractionFailed, setGasAbstractionFailed] = useState(false);
  const [gasAbstractionInitializing, setGasAbstractionInitializing] = useState(false);

  // Get the active wallet
  const activeWallet = wallets[0] as WalletType | undefined;
  const isEmbeddedWallet = activeWallet?.walletClientType === 'privy';

  // Initialize Biconomy when wallet is ready
  useEffect(() => {
    const initBiconomy = async () => {
      if (!activeWallet?.address) return;
      
      setGasAbstractionInitializing(true);
      setGasAbstractionFailed(false);
      
      try {
        if (isEmbeddedWallet && signAuthorization) {
          await activeWallet.switchChain(base.id);
          const client = await initializeBiconomyEmbedded(activeWallet, signAuthorization);
          setBiconomyEmbeddedClient(client);
        } else if (!isEmbeddedWallet) {
          await activeWallet.switchChain(base.id);
          const client = await initializeBiconomyExternal(activeWallet);
          setBiconomyExternalClient(client);
        }
      } catch (err) {
        console.warn('Biconomy initialization failed:', err);
        setGasAbstractionFailed(true);
      } finally {
        setGasAbstractionInitializing(false);
      }
    };

    initBiconomy();
  }, [activeWallet, signAuthorization, isEmbeddedWallet]);

  // Fetch supported currencies on mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await fetchSupportedCurrencies();
        setCurrencies(data);
      } catch (err) {
        setError('Failed to load currencies');
      }
    };
    loadCurrencies();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const data = await fetchSupportedInstitutions(fiat);
      setInstitutions(data);
    } catch (err) {
      setError('Failed to fetch institutions');
    }
  };

  const handleVerifyAccount = async () => {
    if (!institution || !accountIdentifier) return;
    
    try {
      setIsLoading(true);
      await verifyAccount(institution, accountIdentifier);
      setIsAccountVerified(true);
      setError('');
    } catch (err) {
      setError('Account verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchRate = async () => {
    if (!amount || !fiat) return;
    
    try {
      const fetchedRate = await fetchTokenRate('USDC', parseFloat(amount), fiat);
      setRate(fetchedRate);
      setError('');
    } catch (err) {
      setError('Failed to fetch rate');
    }
  };

  useEffect(() => {
    // Clear rate when amount or currency changes
    setRate('');
    setError('');
  }, [amount, fiat]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!authenticated) return login();
    if (!activeWallet?.address) return setError('Wallet not connected');
    if (!isAccountVerified) return setError('Please verify account first');
    if (!rate) return setError('Please fetch exchange rate first');

    try {
      setIsLoading(true);

      // Check balance
      const provider = new ethers.providers.Web3Provider(await activeWallet.getEthereumProvider());
      const signer = provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      
      const decimals = await usdcContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      
      const balance = await usdcContract.balanceOf(activeWallet.address);
      if (balance.lt(amountInWei)) {
        throw new Error('Insufficient USDC balance');
      }

      // Create payment order
      const orderResponse = await axios.post('/api/paycrest/orders', {
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        network: 'base',
        token: 'USDC',
        recipient: { institution, accountIdentifier, accountName, memo },
        returnAddress: activeWallet.address,
        reference: `order-${Date.now()}`,
      });

      const { receiveAddress, amount: orderAmount, reference, senderFee, transactionFee, validUntil } = orderResponse.data.data;

      // Execute transaction
      if (!gasAbstractionFailed) {
        try {
          if (isEmbeddedWallet && biconomyEmbeddedClient) {
            await executeGasAbstractedTransferEmbedded(
              biconomyEmbeddedClient,
              receiveAddress,
              amountInWei.toBigInt(),
              USDC_ADDRESS,
              USDC_ABI
            );
          } else if (!isEmbeddedWallet && biconomyExternalClient) {
            await executeGasAbstractedTransferExternal(
              biconomyExternalClient,
              receiveAddress as `0x${string}`,
              amountInWei.toBigInt(),
              USDC_ADDRESS as `0x${string}`
            );
          } else {
            throw new Error('Gas abstraction client not ready');
          }
        } catch (gasError) {
          console.warn('Gas abstracted transfer failed, falling back to normal transaction:', gasError);
          // Fallback to normal transaction
          const tx = await usdcContract.transfer(receiveAddress, amountInWei);
          await tx.wait();
        }
      } else {
        // Normal transaction
        const tx = await usdcContract.transfer(receiveAddress, amountInWei);
        await tx.wait();
      }

      setSuccess(`Payment order initiated! \nReference: ${reference}\nAmount: ${orderAmount}\nNetwork: base\nToken: USDC\nFee: ${senderFee}\nTransaction Fee: ${transactionFee}\nValid Until: ${validUntil}`);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeeInfo = () => {
    if (gasAbstractionInitializing) {
      return (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-start gap-2">
            <Loader2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
            <div>
              <p className="text-blue-800 font-medium text-xs">Initializing Gas Abstraction</p>
              <p className="text-blue-700 text-xs mt-1">
                Setting up fee sponsorship. This may take a moment...
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (!gasAbstractionFailed && (biconomyEmbeddedClient || biconomyExternalClient)) {
      return (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium text-xs">Gas Abstraction Active</p>
              <p className="text-green-700 text-xs mt-1">
                Transaction fees will be paid in usdc instead of eth. <a className="!text-blue-600 hover:underline" href="https://blog.ambire.com/gas-abstraction-explained/" target="_blank">Learn more</a>
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-medium text-xs">Transaction Fees Required</p>
              <p className="text-amber-700 text-xs mt-1">
                You need ETH in your wallet to pay for Base network transaction fees.
                {gasAbstractionFailed && " (Gas abstraction unavailable)"}
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <div className="fixed inset-0 overflow-y-auto">
        <Header />
  
        {/* Back Button */}
        <div className="container mx-auto max-w-4xl px-6 pt-6">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-3 py-2 !bg-white !border !border-gray-300 !rounded-md hover:!bg-gray-50 hover:!border-gray-400 transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
            Back
          </button>
        </div>
  
        <div className="container mx-auto max-w-4xl px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium mb-4 border border-blue-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
              </svg>
              Stablecoins to Fiat Offramp
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Convert USDC to Cash
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Seamlessly convert your USDC to local currency with instant bank transfers.
            </p>
          </div>
  
          {/* Authentication Status */}
          {!authenticated && (
            <div className="mb-6 p-4 rounded-md border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-100">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900 text-sm">Authentication Required</h3>
                  <p className="text-amber-700 text-xs mt-1">Please login to access the offramp service</p>
                </div>
                <button
                  onClick={login}
                  className="px-4 py-2 !bg-blue-600 hover:!bg-blue-700 !text-white !font-medium !rounded-md !transition-colors !duration-200 text-base"
                >
                  Login with Privy
                </button>
              </div>
            </div>
          )}
  
          {/* Wallet Connection Status */}
          {authenticated && !activeWallet && (
            <div className="mb-6 p-4 rounded-md border border-orange-200 bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-100">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.4 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-orange-900 text-sm">Wallet Connection Required</h3>
                  <p className="text-orange-700 text-xs mt-1">Please connect a wallet to proceed with the offramp</p>
                </div>
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-medium !rounded-md !transition-colors !duration-200 text-base"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          )}
  
          {/* Wallet Info */}
          {authenticated && activeWallet && (
            <div className="mb-6 p-4 rounded-md border border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-100">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 text-sm">Wallet Connected</h3>
                  <p className="text-green-700 text-xs mt-1 font-mono">
                    {activeWallet.address?.slice(0, 6)}...{activeWallet.address?.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600 font-medium">
                    {isEmbeddedWallet ? 'Base Network Ready' : 'not ready'}
                  </p>
                </div>
              </div>
            </div>
          )}
  
          {/* Main Form Card */}
          {authenticated && activeWallet && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">Initiate Offramp Payment</h2>
                <p className="text-gray-600 text-xs">Follow the steps below to convert your USDC to fiat and receive funds in your account.</p>
              </div>
  
              {/* Fee Information */}
              {renderFeeInfo()}
  
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Amount and Currency */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-2 py-1">Step 1</span>
                    <h3 className="text-sm font-medium text-gray-900">Enter Amount and Currency</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (USDC)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 bg-white"
                          placeholder="Minimum 1 USDC"
                          min="1"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="fiat" className="block text-sm font-medium text-gray-700 mb-2">
                        Fiat Currency
                      </label>
                      <select
                        id="fiat"
                        value={fiat}
                        onChange={(e) => { setFiat(e.target.value); fetchInstitutions(); setInstitution(''); setIsAccountVerified(false); }}
                        className="w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 bg-white"
                      >
                        <option value="">Select Currency</option>
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Exchange Rate</label>
                      <button
                        type="button"
                        onClick={handleFetchRate}
                        disabled={!amount || !fiat}
                        className="px-3 py-1 !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-md !font-medium !transition-colors !duration-200 !text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Fetch Rate
                      </button>
                    </div>
                    {rate && (
                      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-blue-800 font-medium text-sm">
                          1 USDC = {rate} {fiat}
                        </p>
                        <p className="text-blue-600 text-xs mt-1">
                          You will receive approximately {(parseFloat(amount) * parseFloat(rate)).toFixed(2)} {fiat}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
  
                {/* Step 2: Recipient Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-2 py-1">Step 2</span>
                    <h3 className="text-sm font-medium text-gray-900">Recipient Details</h3>
                  </div>
                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Bank or Mobile Network
                    </label>
                    <select
                      id="institution"
                      value={institution}
                      onChange={(e) => { setInstitution(e.target.value); setIsAccountVerified(false); }}
                      onFocus={fetchInstitutions}
                      className="w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 bg-white"
                      required
                    >
                      <option value="">Select Institution</option>
                      {institutions.map((inst) => (
                        <option key={inst.code} value={inst.code}>
                          {inst.name} {inst.type === 'mobile' ? '(Mobile Network)' : '(Bank)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Account or Mobile Number
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      value={accountIdentifier}
                      onChange={(e) => { setAccountIdentifier(e.target.value); setIsAccountVerified(false); }}
                      className="w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 bg-white"
                      placeholder="Enter account or mobile number"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">For mobile numbers include country code (e.g., +2341234567890)</p>
                  </div>
                  <div>
                    <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      id="accountName"
                      value={accountName}
                      onChange={(e) => { setAccountName(e.target.value); setIsAccountVerified(false); }}
                      className="w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 bg-white"
                      placeholder="Enter the exact account holder's name"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Ensure the name matches exactly</p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleVerifyAccount}
                      disabled={isLoading || !institution || !accountIdentifier || !accountName}
                      className="w-full px-4 py-2 !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-md !font-medium !transition-colors !duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </div>
                      ) : (
                        'Verify Account'
                      )}
                    </button>
                    {isAccountVerified && (
                      <div className="p-3 bg-green-50 rounded-md border border-green-200 mt-2">
                        <p className="text-green-800 font-medium text-sm">✓ Account verified successfully</p>
                        <p className="text-green-700 text-xs mt-1">Please double-check that this is your account</p>
                      </div>
                    )}
                  </div>
                </div>
  
                {/* Step 3: Transaction Memo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-2 py-1">Step 3</span>
                    <h3 className="text-sm font-medium text-gray-900">Transaction Description</h3>
                  </div>
                  <div>
                    <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Memo
                    </label>
                    <textarea
                      id="memo"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 bg-white resize-none"
                      rows={3}
                      placeholder="Add a memo for this transaction..."
                      required
                    />
                  </div>
                </div>
  
                {/* Error and Success Messages */}
                {error && (
                  <div className="p-3 bg-red-50 rounded-md border border-red-200">
                    <p className="text-red-800 font-medium text-sm">{error}</p>
                  </div>
                )}
  
                {success && (
                  <div className="p-3 bg-green-50 rounded-md border border-green-200">
                    <p className="text-green-800 font-medium text-sm">{success}</p>
                  </div>
                )}
  
                {/* Submit Button */}
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-amber-800 text-sm font-medium">⚠️ Important:</p>
                    <p className="text-amber-700 text-xs mt-1">Fetch rate and verify account before initiating payment</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !rate || !isAccountVerified}
                    className="w-full py-3 px-6 !bg-blue-600 hover:!bg-blue-700 !text-white !font-medium text-base !rounded-md !transition-colors !duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      )}
                      {isLoading ? 'Processing Payment...' : 'Initiate Offramp Payment'}
                    </div>
                  </button>
                  <p className="text-xs text-gray-600 text-center">
                    Funds will be refunded to your wallet if the transaction fails
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
  
        <Footer />
      </div>
    </div>
  );
};

export default PaymentForm;