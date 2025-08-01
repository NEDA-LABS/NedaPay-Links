import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { stablecoins } from '@/data/stablecoins';

const BLOCKCHAINS = [
  { id: 'base', name: 'Base' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'scroll', name: 'Scroll' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bnb', name: 'BNB Smart Chain' },
];

interface PaymentLinkFormProps {
  activeTab: string;
  amount: string;
  setAmount: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  expirationDate: Date | null;
  setExpirationDate: (date: Date | null) => void;
  chain: string;
  setChain: (value: string) => void;
  mobileNumber: string;
  setMobileNumber: (value: string) => void;
  isLoading: boolean;
  handleCreateLink: (e: React.FormEvent) => Promise<void>;
}

export const PaymentLinkForm: React.FC<PaymentLinkFormProps> = ({
  activeTab,
  amount,
  setAmount,
  currency,
  setCurrency,
  description,
  setDescription,
  expirationDate,
  setExpirationDate,
  chain,
  setChain,
  mobileNumber,
  setMobileNumber,
  isLoading,
  handleCreateLink,
}) => {
  return (
    <div className="space-y-4">
      {activeTab === 'offramp' && (
        <div className="group">
          <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-3">
            Mobile Number (Receiver)
          </label>
          <input
            type="tel"
            name="mobile"
            id="mobile"
            required
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="w-full px-6 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
            placeholder="+1234567890"
          />
        </div>
      )}

      <div className="group">
        <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-3">
          Payment Amount
        </label>
        <div className="relative">
          <input
            type="number"
            name="amount"
            id="amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-6 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-6">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="group">
          <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-3">
            Currency
          </label>
          <div className="relative">
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-6 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
            >
              {stablecoins.map((coin) => (
                <option key={coin.baseToken} value={coin.baseToken}>
                  {coin.baseToken} - {coin.name || coin.currency || coin.region}
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
          <label htmlFor="chain" className="block text-sm font-semibold text-gray-700 mb-3">
            Blockchain Network
          </label>
          <div className="relative">
            <select
              id="chain"
              name="chain"
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full px-6 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
            >
              {BLOCKCHAINS.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
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
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-6 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
          placeholder="Payment for services, products, or invoices..."
        />
      </div>

      <div className="group">
        <label htmlFor="expiration" className="block text-sm font-semibold text-gray-700 mb-3">
          Expiration Date
        </label>
        <DatePicker
          selected={expirationDate}
          onChange={(date) => setExpirationDate(date)}
          minDate={new Date()}
          className="w-full px-6 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
        />
      </div>

      <form onSubmit={handleCreateLink}>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-8 !bg-gradient-to-r from-blue-600 to-blue-500 hover:!from-indigo-700 hover:!to-purple-700 text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Link...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Generate Payment Link
            </div>
          )}
        </button>
      </form>
    </div>
  );
};