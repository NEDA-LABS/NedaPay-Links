'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Info, ArrowLeft, X } from 'lucide-react';
import FeeInfoPanel from './FeeInfoPanel';
import VerificationStep from './VerificationStep';
import SuccessMessage from './SuccessMessage';
import useOffRamp from './offrampHooks/useOfframp';
import { ChainConfig } from './offrampHooks/constants';
import { TOKEN_ADDRESSES, TOKEN_ABI, GAS_FEES } from './offrampHooks/tokenConfig';

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

  // Fetch rate automatically with debounce
  useEffect(() => {
    if (!amount || !fiat || parseFloat(amount) <= 0) {
      setRate("");
      return;
    }

    const timer = setTimeout(() => {
      handleFetchRate();
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, fiat]);

  // New function to handle form submission flow
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  // New function to confirm and execute offramp
  const confirmAndSubmit = async () => {
    setShowConfirmation(false);
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  if (success) {
    return <SuccessMessage success={success} onBack={onBack} />;
  }

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-gray-700 mb-8">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-6 text-center">
              Confirm Payment Details
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
                  {amount && rate 
                    ? `${((parseFloat(amount) - parseFloat(amount) * 0.005) * parseFloat(rate)).toFixed(2)} ${fiat}` 
                    : 'N/A'}
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
              {chain.name} Network • {token.toUpperCase()} Balance: 
              <span className="font-medium ml-1">
                {balanceLoading ? (
                  <span className="inline-flex">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Loading...
                  </span>
                ) : (
                  `${balance} ${token.toUpperCase()}`
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
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-semibold mb-3 text-gray-100"
              >
                Amount ({token})
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only positive numbers with max 2 decimal places
                    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                      setAmount(value);
                    }
                  }}
                  className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
                  placeholder={`Minimum 1 ${token}`}
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
                  `${balance} ${token}`
                )}
              </p>
            </div>
            
            <div>
              <label
                htmlFor="fiat"
                className="block text-sm font-semibold mb-3 text-gray-100"
              >
                Fiat Currency
              </label>
              <select
                id="fiat"
                value={fiat}
                onChange={(e) => {
                  setFiat(e.target.value);
                  fetchInstitutions();
                  setInstitution("");
                  setIsAccountVerified(false);
                }}
                className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100"
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
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-100">
                Exchange Rate
              </label>
            </div>
            
            <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              rate 
                ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700" 
                : "bg-gray-800/50 border-gray-700"
            }`}>
              {rate ? (
                <div className="grid grid-rows-1 gap-2">
                  <div>
                    <p className="text-blue-400 font-medium text-sm">
                      1 {token} = {rate} {fiat}
                    </p>
                  </div>
                  <div className="border-l-2 border-blue-700 pl-3">
                    <p className="text-green-400 font-medium text-sm">
                      You will receive:
                    </p>
                    <p className="text-green-300 font-semibold">
                      {((parseFloat(amount) - parseFloat(amount) * 0.005) * parseFloat(rate)).toFixed(2)} {fiat}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  {amount && fiat ? (
                    <div className="flex items-center justify-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Fetching rates...
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Enter amount and select currency to see rates
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Recipient Details */}
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

        {/* Step 3: Transaction Memo */}
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
              Transaction Memo
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
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl border border-amber-700 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 text-sm font-medium">
                  Important:
                </p>
                <p className="text-amber-500 text-xs mt-1">
                  Verify account details before initiating payment, funds sent to the wrong account cannot be retrieved.
                </p>
              </div>
            </div>
          </div>
        
          <button
            type="submit"
            disabled={isLoading || !rate || !isAccountVerified}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-medium text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <div className="flex items-center">
                <span>Initiate Offramp Payment</span>
                <span className="ml-2 text-xs bg-white/10 px-2 py-1 rounded-md">
                  {amount && rate 
                    ? `${((parseFloat(amount) - parseFloat(amount) * 0.005) * parseFloat(rate)).toFixed(2)} ${fiat}` 
                    : ''}
                </span>
              </div>
            )}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Funds will be refunded to your wallet if the transaction fails
          </p>
        </div>
      </form>
    </div>
  );
};

export default OffRampForm;