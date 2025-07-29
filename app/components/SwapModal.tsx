'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import {useWallets} from '@privy-io/react-auth';
import { formatUnits, parseUnits } from 'viem';
import { base, bsc, scroll } from 'viem/chains';
import { stablecoins } from '@/data/stablecoins';
import { getAerodromeQuote, swapAerodrome } from '@/utils/aerodrome';
import { checkAllowance, approveToken } from '@/utils/erc20';
import { addTransaction } from '@/utils/transactionStorage';
import toast from 'react-hot-toast';

const SUPPORTED_CHAINS = [base, bsc, scroll];

const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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

const SwapModal: React.FC<SwapModalProps> = memo(
  ({ open, fromSymbol, onClose, onSwap, maxAmount, onReverse }) => {
    /* ---------- chain & wallet ---------- */
    const { address } = useAccount();
    const {wallets} = useWallets();
    const publicClient = usePublicClient();
    const [activeChain, setActiveChain] = useState(base);
    const [loadingChain, setLoadingChain] = useState(false);

    const switchChain = async (c: any) => {
      if (!wallets[0]) return;
      setLoadingChain(true);
      try {
        await wallets[0].switchChain(c.id);
        setActiveChain(c);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoadingChain(false);
      }
    };

    /* ---------- token selection ---------- */
    const [toSymbol, setToSymbol] = useState('');
    const fromTokenObj = stablecoins.find((c) => c.baseToken === fromSymbol);
    const toTokenObj = stablecoins.find((c) => c.baseToken === toSymbol);

    const fromToken = fromTokenObj?.addresses[activeChain.id] as `0x${string}`;
    const toToken = toTokenObj?.addresses[activeChain.id] as `0x${string}`;
    const fromDecimals = typeof fromTokenObj?.decimals === 'object'
      ? (fromTokenObj.decimals as any)[activeChain.id] ?? 18
      : fromTokenObj?.decimals ?? 18;
    const toDecimals = typeof toTokenObj?.decimals === 'object'
      ? (toTokenObj?.decimals as any)[activeChain.id] ?? 18
      : toTokenObj?.decimals ?? 18;

    const availableTokens = stablecoins.filter(
      (c) => c.chainIds.includes(activeChain.id) && c.baseToken !== fromSymbol
    );

    /* ---------- balances (+ loading) ---------- */
    const [balances, setBalances] = useState({ from: '0', to: '0' });
    const [loadingBalances, setLoadingBalances] = useState(true);

    const loadBalances = useCallback(async () => {
      if (!address || !publicClient) return;
      setLoadingBalances(true);
      const b = { from: '0', to: '0' };
      const loadOne = async (token?: `0x${string}`, dec?: number) => {
        if (!token || !dec) return '0';
        try {
          const raw = await publicClient.readContract({
            address: token,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          });
          return formatUnits(raw, dec);
        } catch {
          return '0';
        }
      };
      b.from = await loadOne(fromToken, fromDecimals);
      b.to = await loadOne(toToken, toDecimals);
      setBalances(b);
      setLoadingBalances(false);
    }, [address, publicClient, activeChain, fromToken, toToken, fromDecimals, toDecimals]);

    useEffect(() => { loadBalances(); }, [loadBalances]);

    /* ---------- swap state ---------- */
    const [amount, setAmount] = useState('');
    const [quote, setQuote] = useState<string | null>(null);
    const [isSwapping, setIsSwapping] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [poolType, setPoolType] = useState<'stable' | 'volatile'>('volatile');

    /* ---------- quote ---------- */
    const fetchQuote = useCallback(async () => {
      if (!amount || !fromToken || !toToken || fromToken === toToken) {
        setQuote(null); setQuoteError(null); return;
      }
      const safe = truncateToDecimals(amount, fromDecimals);
      const parsed = parseUnits(safe, fromDecimals);
      if (parsed === 0n) return;

      try {
        const provider = wallets[0]
          ? new (await import('ethers')).providers.Web3Provider(
              await wallets[0].getEthereumProvider()
            )
          : undefined;
        if (!provider) return;

        const amounts = await getAerodromeQuote({
          provider,
          amountIn: parsed.toString(),
          fromToken,
          toToken,
          stable: poolType === 'stable',
          factory: '0x...', // your factory
        });
        const out = formatUnits(amounts[amounts.length - 1], toDecimals);
        setQuote(out);
        setQuoteError(null);
      } catch {
        setQuote(null);
        setQuoteError('Unable to fetch quote');
      }
    }, [amount, fromToken, toToken, fromDecimals, toDecimals, poolType, wallets]);

    useEffect(() => {
      const t = setTimeout(fetchQuote, 300);
      return () => clearTimeout(t);
    }, [fetchQuote]);

    /* ---------- swap action ---------- */
    const handleSwap = async () => {
      if (!quote || !fromToken || !toToken || !address) return;
      setIsSwapping(true);
      try {
        const provider = new (await import('ethers')).providers.Web3Provider(
          await wallets[0].getEthereumProvider()
        );
        const signer = provider.getSigner();
        const parsed = parseUnits(truncateToDecimals(amount, fromDecimals), fromDecimals);
        const minOut = parseUnits(truncateToDecimals((+quote * 0.995).toFixed(toDecimals), toDecimals), toDecimals);

        const allowance = await checkAllowance({ token: fromToken, owner: address, spender: '0xRouter', provider });
        if (BigInt(allowance) < parsed) {
          const tx = await approveToken({ token: fromToken, spender: '0xRouter', amount: parsed.toString(), signer });
          await tx.wait();
        }

        const tx = await swapAerodrome({
          signer,
          amountIn: parsed.toString(),
          amountOutMin: minOut.toString(),
          fromToken,
          toToken,
          stable: poolType === 'stable',
          factory: '0xFactory',
          userAddress: address,
          deadline: Math.floor(Date.now() / 1000) + 600,
        });

        addTransaction({
          id: `swap-${Date.now()}`,
          fromToken: fromSymbol,
          toToken,
          fromAmount: amount,
          toAmount: quote,
          txHash: tx.hash,
          timestamp: Date.now(),
          status: 'pending',
          walletAddress: address,
        });
        await tx.wait();
        toast.success(`Swapped ${amount} ${fromSymbol} → ${quote} ${toSymbol}`);
        onSwap(fromSymbol, toSymbol, amount);
        onClose();
      } catch (e: any) {
        toast.error(e.reason || e.message);
      } finally {
        setIsSwapping(false);
      }
    };

    /* ---------- reset on open ---------- */
    useEffect(() => {
      if (!open) return;
      setToSymbol(''); setAmount(''); setQuote(null); setQuoteError(null);
    }, [open]);

    if (!open) return null;

    const canSwap = amount && toSymbol && quote && !isSwapping && !loadingBalances;
    const exchangeRate = quote && amount ? (Number(quote) / Number(amount)).toFixed(6) : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
        <div className="w-full max-w-md bg-[#181A20] rounded-2xl border border-slate-700 text-white">
          {/* header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold">Swap</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          {/* chain switch */}
          <div className="flex justify-center gap-2 p-2">
            {SUPPORTED_CHAINS.map((c) => (
              <button
                key={c.id}
                onClick={() => switchChain(c)}
                disabled={loadingChain}
                className={`px-3 py-1 text-sm rounded transition ${
                  activeChain.id === c.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                } ${loadingChain ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* from */}
          <div className="p-4 space-y-3">
            <div className="bg-[#23263B] rounded-lg p-3">
              <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>From</span>
                {loadingBalances ? (
                  <span className="animate-pulse bg-slate-600 w-16 h-4 rounded"></span>
                ) : (
                  <span>Balance: {parseFloat(balances.from).toFixed(4)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{fromTokenObj?.flag}</span>
                <span className="font-medium">{fromSymbol}</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-2xl font-medium outline-none"
              />
            </div>

            {/* reverse */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (!onReverse || !toSymbol) return;
                  onReverse(toSymbol);
                  setToSymbol(fromSymbol);
                  setAmount(quote || '');
                  setQuote(null);
                }}
                className="bg-slate-700 p-1.5 rounded-full text-white"
              >
                ⇅
              </button>
            </div>

            {/* to */}
            <div className="bg-[#23263B] rounded-lg p-3">
              <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>To</span>
                {loadingBalances ? (
                  <span className="animate-pulse bg-slate-600 w-16 h-4 rounded"></span>
                ) : (
                  <span>Balance: {parseFloat(balances.to).toFixed(4)}</span>
                )}
              </div>
              <select
                value={toSymbol}
                onChange={(e) => setToSymbol(e.target.value)}
                className="w-full bg-[#181A20] text-white rounded p-2 outline-none"
              >
                <option value="">Select token</option>
                {availableTokens.map((c) => (
                  <option key={c.baseToken} value={c.baseToken}>
                    {c.flag} {c.baseToken}
                  </option>
                ))}
              </select>
              <div className="text-2xl font-medium mt-1">
                {quote ? parseFloat(quote).toFixed(6) : '0'}
              </div>
            </div>

            {/* advanced */}
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-400">Advanced</summary>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setPoolType('volatile')}
                  className={`px-2 py-1 rounded text-xs ${
                    poolType === 'volatile' ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  Volatile
                </button>
                <button
                  onClick={() => setPoolType('stable')}
                  className={`px-2 py-1 rounded text-xs ${
                    poolType === 'stable' ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  Stable
                </button>
              </div>
            </details>

            {quoteError && <p className="text-red-400 text-sm">{quoteError}</p>}

            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className="w-full bg-blue-600 disabled:bg-slate-700 text-white py-3 rounded-lg"
            >
              {isSwapping ? 'Swapping…' : 'Swap'}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

SwapModal.displayName = 'SwapModal';
export default SwapModal;