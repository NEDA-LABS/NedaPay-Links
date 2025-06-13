import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { stablecoins } from '../data/stablecoins';
import './SwapModal.css';
import { addTransaction } from '../utils/transactionStorage';
import { getAerodromeQuote, swapAerodrome, AERODROME_ROUTER_ADDRESS, AERODROME_FACTORY_ADDRESS } from '../utils/aerodrome';
import { checkAllowance, approveToken } from '../utils/erc20';
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from 'ethers';

interface SwapModalProps {
  open: boolean;
  fromSymbol: string;
  onClose: () => void;
  onSwap: (from: string, to: string, amount: string) => void;
  maxAmount: string;
  onReverse?: (newFrom: string) => void;
}

const truncateToDecimals = (value: string, decimals: number): string => {
  if (!value.includes('.')) return value;
  const [whole, frac] = value.split('.');
  return frac.length > decimals ? `${whole}.${frac.slice(0, decimals)}` : value;
};

const SwapModal: React.FC<SwapModalProps> = memo(({ open, fromSymbol, onClose, onSwap, maxAmount, onReverse }) => {
  const { user, authenticated } = usePrivy();
  const [toSymbol, setToSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const [poolType, setPoolType] = useState<'stable' | 'volatile'>('stable');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [balances, setBalances] = useState({ from: '0', to: '0' });
  const swapInProgress = useRef(false);
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const balanceCache = useRef<Map<string, { value: string; timestamp: number }>>(new Map());
  const CACHE_DURATION = 30000; // 30 seconds cache

  const address = user?.wallet?.address;
  const isConnected = authenticated;

  const fromTokenObj = stablecoins.find(c => c.baseToken === fromSymbol);
  const toTokenObj = stablecoins.find(c => c.baseToken === toSymbol);
  const fromToken = fromTokenObj?.address;
  const toToken = toTokenObj?.address;
  const fromDecimals = fromTokenObj?.decimals ?? 18;
  const toDecimals = toTokenObj?.decimals ?? 18;
  const factory = AERODROME_FACTORY_ADDRESS;

  const handleReverseTokens = useCallback(() => {
    if (!toSymbol || !onReverse) return;
    onReverse(toSymbol);
    setToSymbol(fromSymbol);
    setAmount(quote || '');
    setQuote(null);
    setQuoteError(null);
  }, [toSymbol, fromSymbol, quote, onReverse]);

  const fetchBalances = useCallback(async () => {
    if (!address || !fromToken) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const newBalances = { from: '0', to: '0' };

    const fetchBalance = async (token: string, decimals: number, cacheKey: string) => {
      const cached = balanceCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.value;
      }

      try {
        const contract = new ethers.Contract(token, [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ], provider);
        const bal = await contract.balanceOf(address);
        const value = Number(ethers.utils.formatUnits(bal, decimals)).toLocaleString();
        balanceCache.current.set(cacheKey, { value, timestamp: Date.now() });
        return value;
      } catch {
        return '0';
      }
    };

    const promises = [];
    if (fromToken) promises.push(fetchBalance(fromToken, fromDecimals, `${address}-${fromToken}`));
    if (toToken) promises.push(fetchBalance(toToken, toDecimals, `${address}-${toToken}`));

    const [fromBal, toBal] = await Promise.all(promises);
    newBalances.from = fromBal || '0';
    newBalances.to = toBal || '0';
    setBalances(newBalances);
  }, [address, fromToken, toToken, fromDecimals, toDecimals]);

  const fetchQuote = useCallback(async () => {
    if (!fromToken || !toToken || fromToken === toToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    setIsLoadingQuote(true);
    setQuoteError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const safeAmount = truncateToDecimals(amount, fromDecimals);
      const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals);

      if (parsedAmount.isZero()) {
        setQuoteError('Enter a valid amount.');
        setIsLoadingQuote(false);
        return;
      }

      const amounts = await getAerodromeQuote({
        provider,
        amountIn: parsedAmount.toString(),
        fromToken,
        toToken,
        stable: poolType === 'stable',
        factory
      });

      const quoteAmount = ethers.utils.formatUnits(amounts[amounts.length - 1], toDecimals);
      setQuote(quoteAmount);
      setQuoteError(null);
    } catch (err) {
      console.error('[Quote] Error:', err);
      setQuote(null);
      setQuoteError('No pool exists for this pair or insufficient liquidity.');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [fromToken, toToken, amount, poolType, fromDecimals, toDecimals, factory]);

  useEffect(() => {
    if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
    quoteTimeoutRef.current = setTimeout(fetchQuote, 300); // Reduced debounce time
    return () => { if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current); };
  }, [fetchQuote]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const handleSwap = useCallback(async () => {
    if (!fromToken || !toToken || fromToken === toToken || !address || !amount) {
      setSwapError('Invalid swap details');
      return;
    }

    try {
      setIsSwapping(true);
      swapInProgress.current = true;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const safeAmount = truncateToDecimals(amount, fromDecimals);
      const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals);
      const safeQuote = quote ? truncateToDecimals((Number(quote) * 0.995).toFixed(toDecimals), toDecimals) : '0';
      const minOut = ethers.utils.parseUnits(safeQuote, toDecimals);
      const deadline = Math.floor(Date.now() / 1000) + 600;

      const allowance = await checkAllowance({ token: fromToken, owner: address, spender: AERODROME_ROUTER_ADDRESS, provider });
      if (ethers.BigNumber.from(allowance).lt(parsedAmount)) {
        const approveTx = await approveToken({ token: fromToken, spender: AERODROME_ROUTER_ADDRESS, amount: parsedAmount.toString(), signer });
        await approveTx.wait();
      }

      const tx = await swapAerodrome({
        signer,
        amountIn: parsedAmount.toString(),
        amountOutMin: minOut.toString(),
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
        walletAddress: address
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
        walletAddress: address
      });

      setSwapSuccess(`Successfully swapped ${amount} ${fromSymbol} to ${quote} ${toSymbol}`);
      onSwap(fromSymbol, toSymbol, amount);
    } catch (err: any) {
      setSwapError(err?.reason || err?.message || 'Swap failed');
    } finally {
      setIsSwapping(false);
      swapInProgress.current = false;
    }
  }, [fromToken, toToken, address, amount, quote, fromDecimals, toDecimals, poolType, fromSymbol, toSymbol, onSwap, factory]);

  useEffect(() => {
    setToSymbol('');
    setAmount('');
    setIsSwapping(false);
    setQuote(null);
    setQuoteError(null);
    setSwapError(null);
    setSwapSuccess(null);
  }, [open, fromSymbol]);

  if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full h-full max-h-screen overflow-hidden flex flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl sm:m-4 bg-[#181A20] sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-700">
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-white">Swap Tokens</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:!text-white !transition-colors" aria-label="Close">
              <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-4">
                  <div className="bg-[#23263B] rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-300">You Pay</span>
                      <span className="text-xs text-gray-400">Balance: {balances.from}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{fromTokenObj?.flag ?? ''}</span>
                      <div>
                        <div className="font-semibold text-white">{fromSymbol}</div>
                        <div className="text-xs text-gray-400">{fromTokenObj?.name ?? ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="flex-1 !bg-transparent text-white text-xl sm:text-2xl lg:text-3xl font-bold outline-none placeholder-gray-500"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        max={maxAmount}
                        min="0"
                        placeholder="0.00"
                      />
                      <button
                        className="!bg-blue-600 hover:!bg-blue-700 text-white px-3 py-1 !rounded !font-semibold text-sm !transition-colors"
                        onClick={() => setAmount(maxAmount)}
                        type="button"
                      >
                        MAX
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">≈ $0.00</div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      className="p-3 !bg-[#23263B] hover:!bg-blue-600 !rounded-full text-white transition-colors disabled:opacity-50"
                      onClick={handleReverseTokens}
                      disabled={!toSymbol}
                      type="button"
                      title="Switch tokens"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-[#23263B] rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-300">You Receive</span>
                      <span className="text-xs text-gray-400">Balance: {balances.to}</span>
                    </div>
                    <select
                      className="w-full !bg-[#181A20] text-white !rounded-lg px-3 py-2 mb-3 border border-slate-600 focus:border-blue-500 outline-none"
                      value={toSymbol}
                      onChange={e => setToSymbol(e.target.value)}
                    >
                      <option value="">Select token</option>
                      {stablecoins.filter(c => c.baseToken !== fromSymbol).map(c => (
                        <option key={c.baseToken} value={c.baseToken}>
                          {c.flag ?? ''} {c.baseToken} - {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        {isLoadingQuote ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-400 mr-2"></div>
                            <span className="text-sm sm:text-base lg:text-xl">Loading...</span>
                          </div>
                        ) : (
                          quote ?? '0.00'
                        )}
                      </div>
                      <button
                        className="!text-blue-400 hover:!text-blue-300 text-sm underline"
                        onClick={() => fetchQuote()}
                        disabled={isLoadingQuote}
                        type="button"
                      >
                        {isLoadingQuote ? 'Refreshing...' : 'Refresh Quote'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">≈ $0.00</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#23263B] rounded-xl p-4">
                    <div className="text-sm text-gray-300 mb-3">Pool Type</div>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 px-4 py-2 !rounded-lg font-medium !transition-colors ${
                          poolType === 'stable' ? '!bg-blue-600 !text-white' : '!bg-[#181A20] !text-gray-400 hover:!text-white'
                        }`}
                        onClick={() => setPoolType('stable')}
                        type="button"
                      >
                        Stable
                      </button>
                      <button
                        className={`flex-1 px-4 py-2 !rounded-lg font-medium !transition-colors ${
                          poolType === 'volatile' ? '!bg-blue-600 !text-white' : '!bg-[#181A20] !text-gray-400 hover:!text-white'
                        }`}
                        onClick={() => setPoolType('volatile')}
                        type="button"
                      >
                        Volatile
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#23263B] rounded-xl p-4 space-y-3">
                    <div className="text-sm text-gray-300 mb-3">Swap Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trading Fee</span>
                        <span className="text-white">0.05%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Exchange Rate</span>
                        <span className="text-white text-right">
                          1 {fromSymbol} = {quote && amount ? (Number(quote) / Number(amount)).toFixed(6) : '--'} {toSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price Impact</span>
                        <span className="text-green-400">0.77%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Minimum Received</span>
                        <span className="text-white text-right">
                          {quote ? (Number(quote) * 0.995).toFixed(toDecimals) : '--'} {toSymbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full !bg-blue-600 hover:!bg-blue-700 disabled:!bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 !rounded-xl !transition-colors flex items-center justify-center"
                    onClick={handleSwap}
                    disabled={isSwapping || !amount || !toSymbol || !quote || isLoadingQuote}
                    type="button"
                  >
                    {isSwapping ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Swapping...
                      </>
                    ) : (
                      'Swap Tokens'
                    )}
                  </button>
                </div>
              </div>

              {quoteError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {quoteError}
                </div>
              )}
              {swapError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {swapError}
                </div>
              )}
              {swapSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {swapSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
});

export default SwapModal;