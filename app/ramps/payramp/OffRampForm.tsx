'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertTriangle, Info, ArrowLeft, X } from 'lucide-react';
import FeeInfoPanel from './FeeInfoPanel';
import VerificationStep from './VerificationStep';
import SuccessMessage from './SuccessMessage';
import useOffRamp from './offrampHooks/useOfframp';
import { ChainConfig } from './offrampHooks/constants';
import { TOKEN_ADDRESSES, TOKEN_ABI, GAS_FEES } from './offrampHooks/tokenConfig';
import { fetchTokenRate } from '@/utils/paycrest';
import { fiatBalance as calculateFiatBalance } from './offrampHooks/useOfframp';

type SupportedToken = keyof typeof TOKEN_ADDRESSES;

const OffRampForm: React.FC<{
  chain: ChainConfig;
  token: SupportedToken;
  onTokenChange: (token: SupportedToken) => void;
  onBack: () => void;
  isAccountVerified: boolean;
  setIsAccountVerified: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ chain, token, onTokenChange, onBack }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [inputMode, setInputMode] = useState<'crypto' | 'fiat'>('crypto');
  const [fiatInput, setFiatInput] = useState('');
  const [isRateFetching, setIsRateFetching] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [fiatBalance, setFiatBalance] = useState<string | null>(null);
  const [minimumAmount, setMinimumAmount] = useState<string | null>(null);
  
  const {
    amount,
    setAmount,
    fiat,
    setFiat,
    rate,
    setRate,
    institution,
    setInstitution,
    accountIdentifier,
    setAccountIdentifier,
    accountName,
    setAccountName,
    memo,
    setMemo,
    isLoading,
    error,
    success,
    isAccountVerified,
    setIsAccountVerified,
    balance,
    handleVerifyAccount,
    handleFetchRate,
    handleSubmit,
    renderFeeInfo,
    currencies,
    institutions,
    fetchInstitutions,
    gasAbstractionActive,
    gasAbstractionInitializing,
    isCoinbaseWallet,
    gasAbstractionFailed,
    feeCurrency,
    estimatedFee,
    balanceLoading,
    usdcToFiatRate
  } = useOffRamp(chain, token);

  // Enhanced rate fetching function with retry logic
  // const fetchRateWithRetry = useCallback(async (retryCount = 0, maxRetries = 3) => {
  //   if (!fiat || isRateFetching) return;
    
  //   setIsRateFetching(true);
  //   setRateError(null);
    
  //   try {
  //     await handleFetchRate();
  //     setRateError(null);
  //   } catch (error) {
  //     console.error('Rate fetch error:', error);
      
  //     if (retryCount < maxRetries) {
  //       // Exponential backoff: 1s, 2s, 4s
  //       const delay = Math.pow(2, retryCount) * 1000;
  //       setTimeout(() => {
  //         fetchRateWithRetry(retryCount + 1, maxRetries);
  //       }, delay);
  //     } else {
  //       setRateError('Failed to fetch exchange rate. Please try again.');
  //     }
  //   } finally {
  //     if (retryCount === 0) {
  //       setIsRateFetching(false);
  //     }
  //   }
  // }, [fiat, handleFetchRate, isRateFetching]);

  // Fetch rate when fiat currency changes with debouncing
  useEffect(() => {
    if (!fiat) {
      setRate('');
      setRateError(null);
      return;
    }

    const timer = setTimeout(() => {
      handleFetchRate();
    }, 500);

    return () => clearTimeout(timer);
  }, [fiat, handleFetchRate]);

  // Refetch rate when input values change (with longer debounce)
  useEffect(() => {
    if (!fiat || !rate) return;

    const hasValidInput = inputMode === 'crypto' 
      ? amount && parseFloat(amount) > 0
      : fiatInput && parseFloat(fiatInput) > 0;

    if (hasValidInput) {
      const timer = setTimeout(() => {
        handleFetchRate();
      }, 2000); // Longer debounce for input changes

      return () => clearTimeout(timer);
    }
  }, [amount, fiatInput, inputMode, handleFetchRate]);

  // Calculate crypto amount when in fiat mode
  useEffect(() => {
    if (inputMode === 'fiat' && fiatInput && rate && parseFloat(rate) > 0 && parseFloat(fiatInput) > 0) {
      const netRate = parseFloat(rate) * 0.995; // 0.5% fee
      const requiredCrypto = parseFloat(fiatInput) / netRate;
      setAmount(requiredCrypto.toFixed(6));
    } else if (inputMode === 'fiat' && !fiatInput) {
      setAmount('');
    }
  }, [fiatInput, rate, inputMode, setAmount]);

  // Calculate fiat amount when in crypto mode
  useEffect(() => {
    if (inputMode === 'crypto' && amount && rate && parseFloat(rate) > 0 && parseFloat(amount) > 0) {
      const received = parseFloat(amount) * 0.995 * parseFloat(rate);
      setFiatInput(received.toFixed(2));
    } else if (inputMode === 'crypto' && !amount) {
      setFiatInput('');
    }
  }, [amount, rate, inputMode]);

  // Handle mode switch and sync values
  const handleModeChange = (newMode: 'crypto' | 'fiat') => {
    if (newMode === inputMode) return;

    // Only sync if we have valid rate and current input
    if (rate && parseFloat(rate) > 0) {
      if (inputMode === 'crypto' && amount && parseFloat(amount) > 0) {
        const received = parseFloat(amount) * 0.995 * parseFloat(rate);
        setFiatInput(received.toFixed(2));
      } 
      
    }

    setInputMode(newMode);
  };

  // Calculate received fiat for displays
  const receivedFiat = inputMode === 'fiat' && fiatInput
    ? parseFloat(fiatInput).toFixed(2)
    : rate && amount && parseFloat(rate) > 0 && parseFloat(amount) > 0
      ? ((parseFloat(amount) * 0.995) * parseFloat(rate)).toFixed(2)
      : '0.00';

  // Calculate fiat balance
  useEffect(() => {
    const fetchFiatBalance = async () => {
      const fiatBalance = await calculateFiatBalance(balance, "USDC", fiat, chain);
      setFiatBalance(fiatBalance || null);
    };
    fetchFiatBalance();
  }, [balance, fiat, chain]);

  // Calculate minimum amount
  useEffect(() => {
    const fetchFiatBalance = async () => {
      const minimumAmount = await calculateFiatBalance("1", "USDC", fiat, chain);
      setMinimumAmount(minimumAmount || null);
    };
    fetchFiatBalance();
  }, [balance, fiat, chain]);
  

  // Calculate available based on mode
  const available = inputMode === 'crypto'
    ? `${balance || '0'} ${token.toUpperCase()}`
    : fiatBalance
      ? `${fiatBalance} ${fiat}`
      : rate && balance
        ? 'Calculating...'
        : 'Select currency first';

  // New function to handle form submission flow
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!rate || parseFloat(rate) <= 0) {
      setRateError('Please wait for exchange rate to load');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    
    if (inputMode === 'fiat' && (!fiatInput || parseFloat(fiatInput) <= 0)) {
      return;
    }

    setShowConfirmation(true);
  };

  // New function to confirm and execute offramp
  const confirmAndSubmit = async () => {
    setShowConfirmation(false);
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const calculateTokenAmount = async (amount: number) => {
    // if (!rate || !fiatAmount) return "0";
    const rate = await fetchTokenRate(token, 1, fiat, chain.name);
    try {
      const parsedAmount = amount;
      const tokenAmount = (parsedAmount + (parsedAmount * 0.05)) / parseFloat(rate);
      const formattedAmount = tokenAmount.toFixed(6);
      setAmount(formattedAmount);
      return formattedAmount;
    } catch (error) {
      console.error("Amount calculation error:", error);
      setRateError("Failed to calculate token amount");
      return "0";
    }
  };

  if (success) {
    return <SuccessMessage success={success} onBack={onBack} />;
  }
  
  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-gray-700 mb-8">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex  items-end justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-6 text-center">
              Confirm Payment Details, Ensure Account number is Correct!
            </h3>
            
            <div className="space-y-5 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-400">Sending:</span>
                <span className="text-white font-medium">
                  {amount} {token.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">To Institution:</span>
                <span className="text-white font-medium">{institution}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Account Number:</span>
                <span className="text-white font-medium">{accountIdentifier}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Account Name:</span>
                <span className="text-white font-medium">{accountName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">You Will Receive:</span>
                <span className="text-green-400 font-bold">
                  {receivedFiat} {fiat}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Exchange Rate:</span>
                <span className="text-white font-medium">
                  1 {token.toUpperCase()} = {rate} {fiat}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Memo:</span>
                <span className="text-white font-medium">{memo || 'N/A'}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndSubmit}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button and header */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-all duration-300 text-sm font-medium text-gray-300 hover:text-white"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">
            <ArrowLeft className="w-4 h-4" />
          </span>
          Back to Networks
        </button>
        
        <div className="flex items-center gap-3">
          <img 
            src={chain.icon} 
            alt={chain.name}
            className="w-10 h-10 rounded-full border-2 border-gray-800 shadow-sm"
          />
          <div>
            <h2 className="text-lg font-semibold text-white">
              Convert {token.toUpperCase()} to Cash
            </h2>
            <p className="text-gray-400 text-xs">
              {chain.name} Network • Balance: 
              <span className="font-medium ml-1">
                {balanceLoading ? (
                  <span className="inline-flex">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Loading...
                  </span>
                ) : (
                  <>
                    {balance} {token.toUpperCase()}
                    {fiatBalance && fiat && (
                      <span className="text-gray-500 ml-1">
                        (≈ {fiatBalance} {fiat})
                      </span>
                    )}
                  </>
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {/* Step 1: Amount and Currency */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-purple-400 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-full px-3 py-1">
              Step 1
            </span>
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              Enter Amount and Currency
            </h3>
          </div>

          {/* Fiat Currency Selection First */}
          <div>
            <label
              htmlFor="fiat"
              className="block text-sm font-semibold mb-3 text-gray-100"
            >
              Select Fiat Currency *
            </label>
            <select
              id="fiat"
              value={fiat}
              onChange={(e) => {
                setFiat(e.target.value);
                setRate('');
                setRateError(null);
                fetchInstitutions();
                setInstitution("");
                setIsAccountVerified(false);
                // Clear amounts when currency changes
                setAmount('');
                setFiatInput('');
              }}
              className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100"
              required
            >
              <option value="" className="bg-gray-100 text-gray-500">Select Currency</option>
              {currencies.map((currency) => (
                <option 
                  key={currency.code} 
                  value={currency.code}
                  className="bg-gray-100 text-gray-900"
                >
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>

          {fiat && (
            <>
              {/* Mode Toggle */}
              <div className="flex bg-gray-800 rounded-xl p-1 mb-4 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => handleModeChange('crypto')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'crypto' ? 'bg-purple-700 text-white' : 'text-gray-400'}`}
                >
                  {token.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('fiat')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'fiat' ? 'bg-purple-700 text-white' : 'text-gray-400'}`}
                >
                  {fiat}
                </button>
              </div>
              
              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-semibold mb-3 text-gray-100"
                >
                  {inputMode === 'crypto' ? `Amount to Send (${token.toUpperCase()})` : `Amount to Send (${fiat})`} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={inputMode === 'crypto' ? amount : fiatInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (inputMode === 'crypto') {
                        if (/^\d*\.?\d{0,6}$/.test(value) || value === '') {
                          setAmount(value);
                        }
                      } else {
                        if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                          setFiatInput(value);
                          calculateTokenAmount(parseFloat(value));
                          
                        }
                      }
                    }}
                    className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
                    placeholder={`Minimum ${inputMode === 'crypto' ? 1 : minimumAmount} ${inputMode === 'crypto' ? token.toUpperCase() : fiat}`}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {balanceLoading ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    available
                  )}
                </p>
              </div>
            </>
          )}
          
          {/* Exchange Rate Display */}
          {amount && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-100">
                  Exchange Rate
                </label>
                {/* {(isRateFetching || (!rate && !rateError)) && (
                  <span className="text-xs text-blue-400 flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Enter Amount to get rate
                  </span>
                )} */}
              </div>
              
              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                rate && !rateError
                  ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700" 
                  : rateError
                    ? "bg-gradient-to-r from-red-900/30 to-rose-900/30 border-red-700"
                    : "bg-gray-800/50 border-gray-700"
              }`}>
                {rateError ? (
                  <div className="text-center py-2">
                    <div className="flex items-center justify-center text-red-400 mb-2">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {rateError}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchRate()}
                      disabled={isRateFetching}
                      className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isRateFetching ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                ) : rate && parseFloat(rate) > 0 ? (
                  <div className="grid grid-rows-1 gap-2">
                    <div>
                      <p className="text-blue-400 font-medium text-sm">
                        1 {token.toUpperCase()} = {rate} {fiat}
                      </p>
                      {/* <p className="text-gray-400 text-xs">
                        Rate includes 0.5% service fee
                      </p> */}
                    </div>
                    {((inputMode === 'crypto' && amount) || (inputMode === 'fiat' && fiatInput)) && (
                      <div className="border-l-2 border-blue-700 pl-3">
                        <p className="text-green-400 font-medium text-sm">
                          {inputMode === 'crypto' ? 'You will receive:' : 'You will send:'}
                        </p>
                        <p className="text-green-300 font-semibold">
                          {inputMode === 'crypto' 
                            ? `${receivedFiat} ${fiat}`
                            : `${amount} ${token.toUpperCase()}`}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm">
                      {isRateFetching ? 'Fetching exchange rate...' : 'Waiting for rate...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Recipient Details */}
        {rate && !rateError && (
          <VerificationStep
            institution={institution}
            setInstitution={setInstitution}
            accountIdentifier={accountIdentifier}
            setAccountIdentifier={setAccountIdentifier}
            accountName={accountName}
            setAccountName={setAccountName}
            isAccountVerified={isAccountVerified}
            setIsAccountVerified={setIsAccountVerified}
            isLoading={isLoading}
            handleVerifyAccount={handleVerifyAccount}
            institutions={institutions}
            fetchInstitutions={fetchInstitutions}
            fiat={fiat}
          />
        )}

        {/* Step 3: Transaction Memo */}
        {rate && !rateError && isAccountVerified && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-400 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-full px-3 py-1">
                Step 3
              </span>
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                Transaction Description
              </h3>
            </div>
            <div>
              <label
                htmlFor="memo"
                className="block text-sm font-semibold mb-3 text-gray-400"
              >
                Transaction Memo *
              </label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
                rows={3}
                placeholder="Add a memo for this transaction..."
                required
              />
            </div>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-gradient-to-r from-red-900/30 to-rose-900/30 rounded-xl border border-rose-700 backdrop-blur-sm">
            <div className="flex items-start gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {rate && !rateError && isAccountVerified && (
          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading || !rate || !isAccountVerified || !amount || !memo || isRateFetching}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-medium text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : isRateFetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating rate...
                </>
              ) : (
                <div className="flex items-center">
                  <span>Initiate Offramp Payment</span>
                  <span className="ml-2 text-xs bg-white/10 px-2 py-1 rounded-md">
                    {receivedFiat} {fiat}
                  </span>
                </div>
              )}
            </button>
            
            <p className="text-xs text-gray-100 text-center">
              Funds will be refunded to your wallet if the transaction fails
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default OffRampForm;