import React, { useState, useEffect, useRef } from 'react';
import { stablecoins } from '../data/stablecoins';
import './SwapModal.css';
import { addTransaction } from '../utils/transactionStorage';
import { getAerodromeQuote, swapAerodrome, AERODROME_ROUTER_ADDRESS, AERODROME_FACTORY_ADDRESS } from '../utils/aerodrome';
import { checkAllowance, approveToken } from '../utils/erc20';
import {usePrivy} from "@privy-io/react-auth";
import { ethers } from 'ethers';

interface SwapModalProps {
  open: boolean;
  fromSymbol: string;
  onClose: () => void;
  onSwap: (from: string, to: string, amount: string) => void;
  maxAmount: string;
  onReverse?: (newFrom: string) => void;
}

const SwapModal: React.FC<SwapModalProps> = ({ open, fromSymbol, onClose, onSwap, maxAmount, onReverse }) => {
  function truncateToDecimals(value: string, decimals: number) {
    if (!value.includes('.')) return value;
    const [whole, frac] = value.split('.');
    return frac.length > decimals
      ? `${whole}.${frac.slice(0, decimals)}`
      : value;
  }

  // const { address, isConnected } = useAccount();
  const { user, authenticated } = usePrivy();
  const [toSymbol, setToSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const [poolType, setPoolType] = useState<'stable' | 'volatile'>('stable');
  const swapInProgress = useRef(false);

  const address = user?.wallet?.address;
  const isConnected = authenticated;

  const handleReverseTokens = () => {
    if (!toSymbol) return;
    if (typeof onReverse === 'function') {
      onReverse(toSymbol);
    }
    setToSymbol(fromSymbol);
    setAmount(quote || '');
    setQuote(null);
    setQuoteError(null);
  };

  const fromToken = stablecoins.find((c: any) => c.baseToken === fromSymbol)?.address;
  const toToken = stablecoins.find((c: any) => c.baseToken === toSymbol)?.address;
  const fromTokenObj = stablecoins.find((c: any) => c.baseToken === fromSymbol);
  const toTokenObj = stablecoins.find((c: any) => c.baseToken === toSymbol);
  const fromDecimals = fromTokenObj?.decimals ?? 18;
  const toDecimals = toTokenObj?.decimals ?? 18;
  const factory = AERODROME_FACTORY_ADDRESS;

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!fromToken || !toToken || fromToken === toToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setQuoteError('Select two different tokens and enter a valid amount.');
      return;
    }
    const fetchQuote = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const safeAmount = truncateToDecimals(amount, fromDecimals);
        const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals).toString();
        if (!parsedAmount || parsedAmount === '0') {
          setQuoteError('Enter a valid amount.');
          return;
        }
        try {
          const amounts = await getAerodromeQuote({
            provider,
            amountIn: parsedAmount,
            fromToken,
            toToken,
            stable: poolType === 'stable',
            factory
          });
          setQuote(ethers.utils.formatUnits(amounts[amounts.length - 1], toDecimals));
        } catch (err: any) {
          setQuoteError('No pool exists for this pair or insufficient liquidity.');
          return;
        }
      } catch (err: any) {
        console.error('[Quote] Error fetching quote:', err);
        setQuoteError('Unable to fetch quote');
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount, fromSymbol, toSymbol, factory, poolType, fromDecimals, toDecimals]);

  const handleSwap = async () => {
    setSwapError(null);
    if (!fromToken || !toToken || fromToken === toToken || !address || !amount) {
      setSwapError('Missing or invalid swap details');
      return;
    }
    const safeAmount = truncateToDecimals(amount, fromDecimals);
    const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals).toString();
    const safeQuote = quote ? truncateToDecimals((Number(quote) * 0.995).toFixed(toDecimals), toDecimals) : '0';
    const minOut = quote ? ethers.utils.parseUnits(safeQuote, toDecimals).toString() : '0';
    const deadline = Math.floor(Date.now() / 1000) + 600;
    try {
      setIsSwapping(true);
      swapInProgress.current = true;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const allowance = await checkAllowance({
        token: fromToken,
        owner: address,
        spender: AERODROME_ROUTER_ADDRESS,
        provider
      });
      if (ethers.BigNumber.from(allowance).lt(parsedAmount)) {
        const approveTx = await approveToken({
          token: fromToken,
          spender: AERODROME_ROUTER_ADDRESS,
          amount: parsedAmount,
          signer
        });
        await approveTx.wait();
      }
      
      const tx = await swapAerodrome({
        signer,
        amountIn: parsedAmount,
        amountOutMin: minOut,
        fromToken,
        toToken,
        stable: poolType === 'stable',
        factory,
        userAddress: address,
        deadline
      });
      
      const txId = `swap-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      addTransaction({
        id: txId,
        fromToken: fromSymbol,
        toToken: toSymbol,
        fromAmount: amount,
        toAmount: quote || '0',
        txHash: tx.hash,
        timestamp: Date.now(),
        status: 'pending',
        walletAddress: address || ''
      });
      
      await tx.wait();
      
      addTransaction({
        id: txId,
        fromToken: fromSymbol,
        toToken: toSymbol,
        fromAmount: amount,
        toAmount: quote || '0',
        txHash: tx.hash,
        timestamp: Date.now(),
        status: 'completed',
        walletAddress: address || ''
      });
      
      setIsSwapping(false);
      swapInProgress.current = false;
      setSwapSuccess(`Successfully swapped ${amount} ${fromSymbol} to ${quote} ${toSymbol}`);
      onSwap(fromSymbol, toSymbol, amount);
    } catch (err: any) {
      setSwapError(err?.reason || err?.message || 'Swap failed');
      setIsSwapping(false);
      swapInProgress.current = false;
    }
  };

  useEffect(() => {
    setToSymbol('');
    setAmount('');
    setIsSwapping(false);
    setQuote(null);
    setQuoteError(null);
    setSwapError(null);
    setSwapSuccess(null);
  }, [open, fromSymbol]);

  const availableToCoins = stablecoins.filter((c: any) => c.baseToken !== fromSymbol);
  const [fromBalance, setFromBalance] = useState('0');
  const [toBalance, setToBalance] = useState('0');

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setFromBalance('0');
        setToBalance('0');
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      if (fromToken) {
        try {
          const contract = new ethers.Contract(fromToken, ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"], provider);
          const bal = await contract.balanceOf(address);
          const dec = fromTokenObj?.decimals ?? 18;
          setFromBalance(Number(ethers.utils.formatUnits(bal, dec)).toLocaleString());
        } catch (e) { setFromBalance('0'); }
      }
      if (toToken) {
        try {
          const contract = new ethers.Contract(toToken, ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"], provider);
          const bal = await contract.balanceOf(address);
          const dec = toTokenObj?.decimals ?? 18;
          setToBalance(Number(ethers.utils.formatUnits(bal, dec)).toLocaleString());
        } catch (e) { setToBalance('0'); }
      }
    };
    fetchBalances();
  }, [address, fromToken, toToken, open, fromSymbol, toSymbol]);

  if (!open) return null;

  return (
    <div className="swap-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="swap-modal-backdrop absolute inset-0"></div>
      <div className="swap-modal-container relative w-full max-w-md mx-auto">
        
        {/* Header */}
        <div className="swap-modal-header flex items-center justify-between p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className="swap-icon-container">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h2 className="swap-modal-title">Swap Tokens</h2>
          </div>
          <button onClick={onClose} className="swap-close-btn" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 pt-4 space-y-4">
          
          {/* From Token Panel */}
          <div className="token-panel">
            <div className="token-header">
              <div className="token-label">
                <span className="label-text">You Pay</span>
                <div className="balance-info">
                  Balance: <span className="balance-value">{fromBalance}</span>
                </div>
              </div>
            </div>
            
            <div className="token-content">
              <div className="token-info">
                <div className="token-display">
                  <span className="token-flag">{fromTokenObj?.flag ?? ''}</span>
                  <div>
                    <div className="token-symbol">{fromSymbol}</div>
                    <div className="token-name">{fromTokenObj?.name ?? ''}</div>
                  </div>
                </div>
              </div>
              
              <div className="token-input-section">
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    className="token-amount-input"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    max={maxAmount}
                    min="0"
                    placeholder="0.00"
                  />
                  <button
                    className="max-btn"
                    onClick={() => setAmount(maxAmount)}
                    type="button"
                  >
                    MAX
                  </button>
                </div>
                <div className="token-value">≈ $0.00</div>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <button
              className="swap-direction-btn"
              onClick={handleReverseTokens}
              disabled={!toSymbol}
              type="button"
              title="Switch tokens"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Token Panel */}
          <div className="token-panel">
            <div className="token-header">
              <div className="token-label">
                <span className="label-text">You Receive</span>
                <div className="balance-info">
                  Balance: <span className="balance-value">{toBalance}</span>
                </div>
              </div>
            </div>
            
            <div className="token-content">
              <div className="token-info">
                <select
                  className="token-select"
                  value={toSymbol}
                  onChange={e => setToSymbol(e.target.value)}
                >
                  <option value="">Select token</option>
                  {availableToCoins.map(c => (
                    <option key={c.baseToken} value={c.baseToken}>
                      {c.flag ?? ''} {c.baseToken} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="token-input-section">
                <div className="token-amount-display">
                  {quote ?? '0.00'}
                </div>
                <div className="token-value">≈ $0.00</div>
              </div>
            </div>
          </div>

          {/* Pool Type Selector */}
          <div className="pool-type-section">
            <div className="pool-type-label">Pool Type</div>
            <div className="pool-type-toggle">
              <button
                className={`pool-toggle-btn ${poolType === 'stable' ? 'active' : ''}`}
                onClick={() => setPoolType('stable')}
                type="button"
              >
                Stable
              </button>
              <button
                className={`pool-toggle-btn ${poolType === 'volatile' ? 'active' : ''}`}
                onClick={() => setPoolType('volatile')}
                type="button"
              >
                Volatile
              </button>
            </div>
          </div>

          {/* Swap Details */}
          <div className="swap-details-panel">
            <div className="details-row">
              <span className="detail-label">Trading Fee</span>
              <span className="detail-value">0.05%</span>
            </div>
            <div className="details-row">
              <span className="detail-label">Exchange Rate</span>
              <span className="detail-value">
                1 {fromSymbol} = {quote && amount ? (Number(quote) / Number(amount)).toFixed(6) : '--'} {toSymbol}
              </span>
            </div>
            <div className="details-row">
              <span className="detail-label">Price Impact</span>
              <span className="detail-value impact-low">0.77%</span>
            </div>
            <div className="details-row">
              <span className="detail-label">Minimum Received</span>
              <span className="detail-value">
                {quote ? (Number(quote) * 0.995).toFixed(toDecimals) : '--'} {toSymbol}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              className="secondary-btn flex-1"
              onClick={() => window.location.reload()}
              type="button"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              className="primary-btn flex-1"
              onClick={handleSwap}
              disabled={isSwapping || !amount || !toSymbol || !quote}
              type="button"
            >
              {isSwapping ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Swapping...
                </div>
              ) : (
                'Swap Tokens'
              )}
            </button>
          </div>

          {/* Status Messages */}
          {swapError && (
            <div className="status-message error">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {swapError}
            </div>
          )}
          {swapSuccess && (
            <div className="status-message success">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {swapSuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapModal;