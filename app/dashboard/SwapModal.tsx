import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { stablecoins } from "../data/stablecoins";
import "./SwapModal.css";
import { addTransaction } from "../utils/transactionStorage";
import {
  getAerodromeQuote,
  swapAerodrome,
  AERODROME_ROUTER_ADDRESS,
  AERODROME_FACTORY_ADDRESS,
} from "../utils/aerodrome";
import { checkAllowance, approveToken } from "../utils/erc20";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";

interface SwapModalProps {
  open: boolean;
  fromSymbol: string;
  onClose: () => void;
  onSwap: (from: string, to: string, amount: string) => void;
  maxAmount: string;
  onReverse?: (newFrom: string) => void;
}

const truncateToDecimals = (value: string, decimals: number): string => {
  if (!value.includes(".")) return value;
  const [whole, frac] = value.split(".");
  return frac.length > decimals ? `${whole}.${frac.slice(0, decimals)}` : value;
};

const SwapModal: React.FC<SwapModalProps> = memo(
  ({ open, fromSymbol, onClose, onSwap, maxAmount, onReverse }) => {
    const { user, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [toSymbol, setToSymbol] = useState("");
    const [amount, setAmount] = useState("");
    const [isSwapping, setIsSwapping] = useState(false);
    const [quote, setQuote] = useState<string | null>(null);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [swapError, setSwapError] = useState<string | null>(null);
    const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
    const [poolType, setPoolType] = useState<"stable" | "volatile">("volatile"); // Default to volatile (recommended)
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [balances, setBalances] = useState({ from: "0", to: "0" });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const swapInProgress = useRef(false);
    const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const balanceCache = useRef<
      Map<string, { value: string; timestamp: number }>
    >(new Map());
    const CACHE_DURATION = 30000;

    const address = wallets[0]?.address;
    const isConnected = authenticated && !!wallets[0]?.address;

    const fromTokenObj = stablecoins.find((c) => c.baseToken === fromSymbol);
    const toTokenObj = stablecoins.find((c) => c.baseToken === toSymbol);
    const fromToken = fromTokenObj?.address;
    const toToken = toTokenObj?.address;
    const fromDecimals = fromTokenObj?.decimals ?? 18;
    const toDecimals = toTokenObj?.decimals ?? 18;
    const factory = AERODROME_FACTORY_ADDRESS;

    const formatBalance = (balance: string) => {
      const num = parseFloat(balance.replace(/,/g, ""));
      if (num === 0) return "0";
      if (num < 0.01) return "<0.01";
      if (num < 1000) return num.toFixed(2);
      if (num < 1000000) return (num / 1000).toFixed(1) + "K";
      return (num / 1000000).toFixed(1) + "M";
    };

    const handleReverseTokens = useCallback(() => {
      if (!toSymbol || !onReverse) return;
      onReverse(toSymbol);
      setToSymbol(fromSymbol);
      setAmount(quote || "");
      setQuote(null);
      setQuoteError(null);
    }, [toSymbol, fromSymbol, quote, onReverse]);

    const fetchBalances = useCallback(async () => {
      if (!address || !fromToken || !wallets[0]) return;

      const provider = new ethers.providers.Web3Provider(
        await wallets[0].getEthereumProvider()
      );
      const newBalances = { from: "0", to: "0" };

      const fetchBalance = async (
        token: string,
        decimals: number,
        cacheKey: string
      ) => {
        const cached = balanceCache.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.value;
        }

        try {
          const contract = new ethers.Contract(
            token,
            [
              "function balanceOf(address owner) view returns (uint256)",
              "function decimals() view returns (uint8)",
            ],
            provider
          );
          const bal = await contract.balanceOf(address);
          const value = Number(
            ethers.utils.formatUnits(bal, decimals)
          ).toLocaleString();
          balanceCache.current.set(cacheKey, { value, timestamp: Date.now() });
          return value;
        } catch {
          return "0";
        }
      };

      const promises = [];
      if (fromToken)
        promises.push(
          fetchBalance(fromToken, fromDecimals, `${address}-${fromToken}`)
        );
      if (toToken)
        promises.push(
          fetchBalance(toToken, toDecimals, `${address}-${toToken}`)
        );

      const [fromBal, toBal] = await Promise.all(promises);
      newBalances.from = fromBal || "0";
      newBalances.to = toBal || "0";
      setBalances(newBalances);
    }, [address, fromToken, toToken, fromDecimals, toDecimals]);

    const fetchQuote = useCallback(async () => {
      if (
        !fromToken ||
        !toToken ||
        fromToken === toToken ||
        !amount ||
        isNaN(Number(amount)) ||
        Number(amount) <= 0
      ) {
        setQuote(null);
        setQuoteError(null);
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const provider = new ethers.providers.Web3Provider(
          await wallets[0].getEthereumProvider()
        );
        const safeAmount = truncateToDecimals(amount, fromDecimals);
        const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals);

        if (parsedAmount.isZero()) {
          setQuoteError("Enter a valid amount.");
          setIsLoadingQuote(false);
          return;
        }

        const amounts = await getAerodromeQuote({
          provider,
          amountIn: parsedAmount.toString(),
          fromToken,
          toToken,
          stable: poolType === "stable",
          factory,
        });

        const quoteAmount = ethers.utils.formatUnits(
          amounts[amounts.length - 1],
          toDecimals
        );
        setQuote(quoteAmount);
        setQuoteError(null);
      } catch (err) {
        console.error("[Quote] Error:", err);
        setQuote(null);
        setQuoteError(
          "Unable to fetch quote. Try adjusting the amount or check liquidity."
        );
      } finally {
        setIsLoadingQuote(false);
      }
    }, [
      fromToken,
      toToken,
      amount,
      poolType,
      fromDecimals,
      toDecimals,
      factory,
    ]);

    useEffect(() => {
      if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
      quoteTimeoutRef.current = setTimeout(fetchQuote, 300);
      return () => {
        if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
      };
    }, [fetchQuote]);

    useEffect(() => {
      fetchBalances();
      const interval = setInterval(fetchBalances, CACHE_DURATION);
      return () => clearInterval(interval);
    }, [fetchBalances]);

    const handleSwap = useCallback(async () => {
      if (
        !fromToken ||
        !toToken ||
        fromToken === toToken ||
        !address ||
        !amount
      ) {
        setSwapError("Invalid swap details");
        return;
      }

      try {
        setIsSwapping(true);
        swapInProgress.current = true;
        const provider = new ethers.providers.Web3Provider(
          await wallets[0].getEthereumProvider()
        );
        const signer = provider.getSigner();
        const safeAmount = truncateToDecimals(amount, fromDecimals);
        const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals);
        const safeQuote = quote
          ? truncateToDecimals(
              (Number(quote) * 0.995).toFixed(toDecimals),
              toDecimals
            )
          : "0";
        const minOut = ethers.utils.parseUnits(safeQuote, toDecimals);
        const deadline = Math.floor(Date.now() / 1000) + 600;

        const allowance = await checkAllowance({
          token: fromToken,
          owner: address,
          spender: AERODROME_ROUTER_ADDRESS,
          provider,
        });
        if (ethers.BigNumber.from(allowance).lt(parsedAmount)) {
          const approveTx = await approveToken({
            token: fromToken,
            spender: AERODROME_ROUTER_ADDRESS,
            amount: parsedAmount.toString(),
            signer,
          });
          await approveTx.wait();
        }

        const tx = await swapAerodrome({
          signer,
          amountIn: parsedAmount.toString(),
          amountOutMin: minOut.toString(),
          fromToken,
          toToken,
          stable: poolType === "stable",
          factory,
          userAddress: address,
          deadline,
        });

        const txId = `swap-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        addTransaction({
          id: txId,
          fromToken: fromSymbol,
          toToken: toSymbol,
          fromAmount: amount,
          toAmount: quote || "0",
          txHash: tx.hash,
          timestamp: Date.now(),
          status: "pending",
          walletAddress: address,
        });

        await tx.wait();
        addTransaction({
          id: txId,
          fromToken: fromSymbol,
          toToken: toSymbol,
          fromAmount: amount,
          toAmount: quote || "0",
          txHash: tx.hash,
          timestamp: Date.now(),
          status: "completed",
          walletAddress: address,
        });

        setSwapSuccess(
          `Successfully swapped ${amount} ${fromSymbol} for ${quote} ${toSymbol}`
        );
        onSwap(fromSymbol, toSymbol, amount);

        // Auto-close after successful swap
        setTimeout(() => {
          onClose();
          setSwapSuccess(null);
        }, 2000);
      } catch (err: any) {
        setSwapError(
          err?.reason || err?.message || "Transaction failed. Please try again."
        );
      } finally {
        setIsSwapping(false);
        swapInProgress.current = false;
      }
    }, [
      fromToken,
      toToken,
      address,
      amount,
      quote,
      fromDecimals,
      toDecimals,
      poolType,
      fromSymbol,
      toSymbol,
      onSwap,
      factory,
      onClose,
    ]);

    useEffect(() => {
      setToSymbol("");
      setAmount("");
      setIsSwapping(false);
      setQuote(null);
      setQuoteError(null);
      setSwapError(null);
      setSwapSuccess(null);
      setShowAdvanced(false);
    }, [open, fromSymbol]);

    if (!open) return null;

    const canSwap =
      amount && toSymbol && quote && !isLoadingQuote && !isSwapping;
    const exchangeRate =
      quote && amount ? (Number(quote) / Number(amount)).toFixed(6) : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-[#181A20] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Swap</h2>
            <button
              onClick={onClose}
              className="!text-slate-400 hover:!text-white !transition-colors p-1"
              type="button"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* From Token */}
            <div className="bg-[#23263B] rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">From</span>
                <span className="text-sm text-slate-400">
                  Balance: {formatBalance(balances.from)}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{fromTokenObj?.flag}</span>
                  <span className="font-medium text-white">{fromSymbol}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="flex-1 !bg-transparent !text-white text-2xl font-medium !outline-none placeholder-slate-500 !border-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  max={maxAmount}
                  min="0"
                />
                <button
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white px-3 py-1.5 !rounded-lg text-sm font-medium !transition-colors"
                  onClick={() => setAmount(maxAmount)}
                  type="button"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                className="!bg-[#23263B] hover:!bg-blue-600 !text-white p-2 !rounded-full !transition-colors disabled:opacity-50 border-4 border-[#181A20]"
                onClick={handleReverseTokens}
                disabled={!toSymbol}
                type="button"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </button>
            </div>

            {/* To Token */}
            <div className="bg-[#23263B] rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">To</span>
                {toSymbol && (
                  <span className="text-sm text-slate-400">
                    Balance: {formatBalance(balances.to)}
                  </span>
                )}
              </div>

              <div className="mb-3">
                <select
                  className="w-full !bg-[#181A20] !text-white !rounded-lg px-3 py-2 !border border-slate-600 focus:!border-blue-500 !outline-none"
                  value={toSymbol}
                  onChange={(e) => setToSymbol(e.target.value)}
                >
                  <option value="">Select token</option>
                  {stablecoins
                    .filter((c) => c.baseToken !== fromSymbol)
                    .map((c) => (
                      <option key={c.baseToken} value={c.baseToken}>
                        {c.flag} {c.baseToken}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-medium text-white">
                  {isLoadingQuote ? (
                    <div className="flex items-center text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></div>
                      <span className="text-lg">...</span>
                    </div>
                  ) : quote ? (
                    parseFloat(quote).toFixed(4)
                  ) : (
                    "0"
                  )}
                </div>
                {exchangeRate && (
                  <div className="text-xs text-slate-400 text-right">
                    1 {fromSymbol} = {exchangeRate} {toSymbol}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              className="w-full !text-slate-400 hover:!text-white text-sm !transition-colors flex items-center justify-center gap-1"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <span>Advanced</span>
              <svg
                className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="bg-[#23263B] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Pool Type</span>
                  <div className="flex gap-1">
                    <button
                      className={`px-3 py-1 !rounded-lg text-xs font-medium !transition-colors ${
                        poolType === "volatile"
                          ? "!bg-blue-600 !text-white"
                          : "!bg-[#181A20] !text-slate-400 hover:!text-white"
                      }`}
                      onClick={() => setPoolType("volatile")}
                      type="button"
                    >
                      Volatile {poolType === "volatile" && "(Recommended)"}
                    </button>
                    <button
                      className={`px-3 py-1 !rounded-lg text-xs font-medium !transition-colors ${
                        poolType === "stable"
                          ? "!bg-blue-600 !text-white"
                          : "!bg-[#181A20] !text-slate-400 hover:!text-white"
                      }`}
                      onClick={() => setPoolType("stable")}
                      type="button"
                    >
                      Stable
                    </button>
                  </div>
                </div>

                {quote && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Minimum received</span>
                    <span className="text-white">
                      {(Number(quote) * 0.995).toFixed(4)} {toSymbol}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Messages */}
            {(quoteError || swapError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  {quoteError || swapError}
                </p>
              </div>
            )}

            {/* Success Message */}
            {swapSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">{swapSuccess}</p>
              </div>
            )}

            {/* Swap Button */}
            <button
              className={`w-full !font-medium py-4 !rounded-xl !transition-all ${
                canSwap
                  ? "!bg-blue-600 hover:!bg-blue-700 !text-white"
                  : "!bg-slate-700 !text-slate-400 cursor-not-allowed"
              }`}
              onClick={handleSwap}
              disabled={!canSwap}
              type="button"
            >
              {isSwapping ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Swapping...
                </div>
              ) : !isConnected ? (
                "Connect Wallet"
              ) : !amount ? (
                "Enter amount"
              ) : !toSymbol ? (
                "Select token"
              ) : !quote && !isLoadingQuote ? (
                "No quote available"
              ) : (
                "Swap"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default SwapModal;
