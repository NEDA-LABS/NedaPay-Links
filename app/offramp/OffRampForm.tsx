'use client';

import React from 'react';
import { Loader2, AlertTriangle, Info, ArrowLeft } from 'lucide-react';
import FeeInfoPanel from './FeeInfoPanel';
import VerificationStep from './VerificationStep';
import SuccessMessage from './SuccessMessage';
import useOffRamp from './offrampHooks/useOfframp';
import { ChainConfig } from './offrampHooks/constants';
import { TOKEN_ADDRESSES, TOKEN_ABI, GAS_FEES } from './offrampHooks/tokenConfig';

type SupportedToken = keyof typeof TOKEN_ADDRESSES;
type ChainId = keyof typeof TOKEN_ADDRESSES[SupportedToken];

const OffRampForm: React.FC<{
  chain: ChainConfig & { id: ChainId };
  token: SupportedToken;
  onTokenChange: (token: SupportedToken) => void;
  onBack: () => void;
  isAccountVerified: boolean;
  setIsAccountVerified: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ chain, token, onTokenChange, onBack }) => {
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

  if (success) {
    return <SuccessMessage success={success} onBack={onBack} />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
      {/* Back button and header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 !bg-white/80 !backdrop-blur-sm !border !border-gray-200 !rounded-xl hover:!bg-white hover:!shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
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
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Convert {token} to Cash
            </h2>
            <p className="text-gray-600 text-xs">
              {chain.name} Network • {token} Balance: 
              <span className="font-medium ml-1">
                {balanceLoading ? 'Loading...' : balance} {token}
              </span>
            </p>
          </div>
        </div>
      </div>

      <FeeInfoPanel
        chain={chain}
        token={token}
        gasAbstractionActive={gasAbstractionActive ?? false}
        gasAbstractionInitializing={gasAbstractionInitializing}
        isCoinbaseWallet={isCoinbaseWallet}
        gasAbstractionFailed={gasAbstractionFailed}
        feeCurrency={feeCurrency}
        estimatedFee={estimatedFee}
        balance={balance}
        balanceLoading={balanceLoading}
        fiat={fiat}
        usdcToFiatRate={usdcToFiatRate ?? undefined}
      />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Amount and Currency */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-3 py-1">
              Step 1
            </span>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Enter Amount and Currency
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-semibold mb-3 text-gray-700"
              >
                Amount ({token})
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-4 text-base text-slate-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                  placeholder={`Minimum 1 ${token}`}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {balanceLoading ? 'Loading...' : balance} {token}
              </p>
            </div>
            
            <div>
              <label
                htmlFor="fiat"
                className="block text-sm font-semibold mb-3 text-gray-700"
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
                className="w-full px-4 py-4 text-base text-slate-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
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
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Exchange Rate
              </label>
              <button
                type="button"
                onClick={handleFetchRate}
                disabled={!amount || !fiat}
                className="px-4 py-2 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !rounded-xl !font-medium !shadow-lg hover:!shadow-xl !transition-all !duration-300 !text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                Fetch Rate
              </button>
            </div>
            
            {rate && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 backdrop-blur-sm">
                <div className="grid grid-rows-1 gap-2">
                  <div>
                    <p className="text-blue-800 font-medium text-sm">
                      1 {token} = {rate} {fiat}
                    </p>
                  </div>
                  <div className="border-l-2 border-blue-300 pl-3">
                    <p className="text-green-700 font-medium text-sm">
                      You will receive:
                    </p>
                    <p className="text-green-800 font-semibold">
                      {amount && rate
                        ? ((parseFloat(amount) - parseFloat(amount) * 0.005) * parseFloat(rate)).toFixed(2)
                        : "0.00"} {fiat}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
          isLoading={isLoading}
          handleVerifyAccount={handleVerifyAccount}
          institutions={institutions}
          fetchInstitutions={fetchInstitutions}
          fiat={fiat}
        />

        {/* Step 3: Transaction Memo */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full px-3 py-1">
              Step 3
            </span>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Transaction Description
            </h3>
          </div>
          <div>
            <label
              htmlFor="memo"
              className="block text-sm font-semibold mb-3 text-gray-700"
            >
              Transaction Memo
            </label>
            <textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-4 py-4 text-base text-slate-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm resize-none"
              rows={3}
              placeholder="Add a memo for this transaction..."
              required
            />
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 backdrop-blur-sm">
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 backdrop-blur-sm">
            <p className="text-amber-800 text-sm font-medium">
              Important:
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Fetch rate and verify account before initiating payment
            </p>
          </div>
        
          <button
            type="submit"
            disabled={isLoading || !rate || !isAccountVerified}
            className="w-full py-4 px-6 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-medium text-base !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center gap-2">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              )}
              {isLoading
                ? "Processing Payment..."
                : "Initiate Offramp Payment"}
            </div>
          </button>
          
          <p className="text-xs text-gray-600 text-center">
            Funds will be refunded to your wallet if the transaction fails
          </p>
        </div>
      </form>
    </div>
  );
};

export default OffRampForm;