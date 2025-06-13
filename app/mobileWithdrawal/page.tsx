'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

const SUPPORTED_NETWORKS = {
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
  }
};

const MOBILE_MONEY_PROVIDERS = [
  { code: 'MTN', name: 'M-Pesa', country: 'TZ' },
  { code: 'TIGO', name: 'Tigo Pesa', country: 'TZ' },
  { code: 'AIRTEL', name: 'Airtel Money', country: 'TZ' },
  { code: 'VODACOM', name: 'Halo Pesa', country: 'TZ' }
];

export default function mobileWithdrawal() {
  const { ready, authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: '',
    accountName: '',
    provider: 'MTN',
    currency: 'TZS'
  });
  
  // App state
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  interface ExchangeRate {
    toAmount: string;
    // Add other properties if needed
  }
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  interface Transaction {
    referenceId: string;
    status: string;
    amount: string;
    currency: string;
    transactionId?: string;
  }

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Get wallet balance
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      fetchBalance();
    }
  }, [authenticated, wallets]);

  // Fetch exchange rate when amount changes
  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      fetchExchangeRate();
    }
  }, [formData.amount]);

  const fetchBalance = async () => {
    try {
      const wallet = wallets[0];
      if (!wallet) return;

      const provider = new ethers.providers.JsonRpcProvider(SUPPORTED_NETWORKS.base.rpcUrl);
      const contract = new ethers.Contract(
        SUPPORTED_NETWORKS.base.usdcAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      );

      const balance = await contract.balanceOf(wallet.address);
      const decimals = await contract.decimals();
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      setBalance(formattedBalance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/kotani/exchange-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: 'USDC',
          toCurrency: formData.currency,
          amount: formData.amount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (parseFloat(formData.amount) > parseFloat(balance)) {
      setError('Insufficient balance');
      return false;
    }

    if (!formData.phoneNumber || !/^255\d{9}$/.test(formData.phoneNumber)) {
      setError('Please enter a valid Tanzanian phone number (format: 255XXXXXXXXX)');
      return false;
    }

    if (!formData.accountName.trim()) {
      setError('Please enter account name');
      return false;
    }

    return true;
  };

  const generateReferenceId = () => {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleOfframp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const referenceId = generateReferenceId();
      
      // Initiate offramp transaction directly
      const offrampResponse = await fetch('/api/kotani/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount,
          currency: formData.currency,
          walletAddress: wallets[0].address,
          receiverType: 'mobile',
          phoneNumber: formData.phoneNumber,
          accountName: formData.accountName,
          networkProvider: formData.provider,
          referenceId: referenceId
        })
      });

      if (!offrampResponse.ok) {
        const errorData = await offrampResponse.json();
        throw new Error(errorData.error || 'Failed to initiate offramp');
      }

      const offrampResult = await offrampResponse.json();
      
      const transactionData = {
        referenceId: referenceId,
        status: offrampResult.status || 'PENDING',
        amount: formData.amount,
        currency: formData.currency,
        transactionId: offrampResult.transactionId
      };
      
      setTransaction(transactionData);
      setSuccess(`Offramp initiated successfully! Reference ID: ${referenceId}`);
      
      // Reset form
      setFormData({
        amount: '',
        phoneNumber: '',
        accountName: '',
        provider: 'MTN',
        currency: 'TZS'
      });
      
      // Refresh balance
      fetchBalance();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process offramp');
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async () => {
    if (!transaction?.referenceId) return;

    setStatusLoading(true);
    try {
      const response = await fetch('/api/kotani/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: transaction.referenceId
        })
      });

      if (response.ok) {
        const statusData = await response.json();
        setTransaction(prev => prev ? {
          ...prev,
          status: statusData.status || prev.status
        } : null);
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const cancelTransaction = async () => {
    if (!transaction?.referenceId) return;

    try {
      const response = await fetch('/api/kotani/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: transaction.referenceId
        })
      });

      if (response.ok) {
        const cancelData = await response.json();
        setTransaction(prev => prev ? {
          ...prev,
          status: 'CANCELLED'
        } : null);
        setSuccess('Transaction cancelled successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel transaction');
      }
    } catch (err) {
      setError('Error cancelling transaction');
    }
  };

  if (!ready) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
        <p className="mb-4">Please connect your wallet to access the offramp feature.</p>
        <button
          onClick={login}
          className="w-full !bg-blue-600 text-white py-2 px-4 !rounded hover:!bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Crypto to Mobile Money</h1>
      
      {/* Wallet Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Wallet Information</h2>
        <p className="text-sm text-gray-600">Address: {wallets[0]?.address}</p>
        <p className="text-sm text-gray-600">USDC Balance: {parseFloat(balance).toFixed(2)} USDC</p>
        <p className="text-sm text-gray-600">Network: Base</p>
      </div>

      {/* Offramp Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USDC)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {exchangeRate && (
            <p className="text-sm text-gray-500 mt-1">
              ≈ {exchangeRate.toAmount} {formData.currency}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Money Provider
          </label>
          <select
            name="provider"
            value={formData.provider}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {MOBILE_MONEY_PROVIDERS.map(provider => (
              <option key={provider.code} value={provider.code}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name
          </label>
          <input
            type="text"
            name="accountName"
            value={formData.accountName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="255123456789"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter Tanzanian phone number (format: 255XXXXXXXXX)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="TZS">Tanzanian Shilling (TZS)</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        <button
          onClick={handleOfframp}
          disabled={loading || !formData.amount || !formData.phoneNumber || !formData.accountName}
          className="w-full !bg-blue-600 text-white py-3 px-4 !rounded-md hover:!bg-blue-700 disabled:!bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : 'Send to Mobile Money'}
        </button>
      </div>

      {/* Transaction Status */}
      {transaction && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Transaction Details</h3>
          <p className="text-sm text-gray-600">Reference ID: {transaction.referenceId}</p>
          {transaction.transactionId && (
            <p className="text-sm text-gray-600">Transaction ID: {transaction.transactionId}</p>
          )}
          <p className="text-sm text-gray-600">Status: <span className={`font-medium ${
            transaction.status === 'COMPLETED' ? 'text-green-600' :
            transaction.status === 'FAILED' || transaction.status === 'CANCELLED' ? 'text-red-600' :
            'text-yellow-600'
          }`}>{transaction.status}</span></p>
          <p className="text-sm text-gray-600">
            Amount: {transaction.amount} USDC → {formData.currency}
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={checkTransactionStatus}
              disabled={statusLoading}
              className="px-4 py-2 !bg-blue-600 text-white text-sm !rounded hover:!bg-blue-700 disabled:!bg-gray-400"
            >
              {statusLoading ? 'Checking...' : 'Check Status'}
            </button>
            
            {transaction.status === 'PENDING' && (
              <button
                onClick={cancelTransaction}
                className="px-4 py-2  !bg-red-600 text-white text-sm !rounded hover:!bg-red-700"
              >
                Cancel Transaction
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}