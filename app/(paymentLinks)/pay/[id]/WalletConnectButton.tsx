"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from 'react-hot-toast';
import { stablecoins } from "@/data/stablecoins";
import { SUPPORTED_CHAINS_NORMAL as SUPPORTED_CHAINS } from "@/offramp/offrampHooks/constants";
import { utils } from "ethers";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";

export default function WalletConnectButton({ 
  to, 
  amount, 
  currency, 
  description, 
  chainId 
}: { 
  to: string; 
  amount: string; 
  currency: string; 
  description?: string;
  chainId?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAmount, setUserAmount] = useState(amount);
  const [isOpenAmount, setIsOpenAmount] = useState(false);
  
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  
  const connectedWallet = wallets[0];
  const currentChainId = connectedWallet?.chainId.split(":")[1] ? parseInt(connectedWallet.chainId.split(":")[1]) : null;

  useEffect(() => {
    setIsOpenAmount(parseFloat(amount) === 0);
    setUserAmount(amount);
  }, [amount]);

  const saveTransactionToDB = async (
    merchantId: string,
    wallet: string,
    amount: string,
    currency: string,
    description: string | undefined,
    status: "Pending" | "Completed",
    txHash: string,
    chainId: number
  ) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId,
          wallet,
          amount,
          currency,
          description: description || undefined,
          status,
          txHash,
          chainId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save transaction:", errorData);
        return false;
      }
      return true;
    } catch (dbError) {
      console.error("Error saving transaction to database:", dbError);
      return false;
    }
  };

  const updateTransactionStatus = async (
    txHash: string,
    merchantId: string,
    walletAddress: string,
    amount: string,
    currency: string,
    description: string | undefined,
    chainId: number
  ) => {
    try {
      const response = await fetch(`/api/transactions?txHash=${txHash}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId,
          wallet: walletAddress,
          amount,
          currency,
          description: description || undefined,
          status: "Completed",
          chainId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update transaction:", errorData);
        return false;
      }
      return true;
    } catch (dbError) {
      console.error("Error updating transaction in database:", dbError);
      return false;
    }
  };

  const switchChain = async (targetChainId: number) => {
    try {
      if (!connectedWallet) {
        throw new Error("No wallet connected");
      }

      const targetChain = SUPPORTED_CHAINS.find(c => c.id === targetChainId);
      if (!targetChain) {
        throw new Error("Unsupported chain");
      }

      await connectedWallet.switchChain(targetChainId);
      return true;
    } catch (switchError: any) {
      console.error('Error switching chain:', switchError);
      setError(`Failed to switch to ${SUPPORTED_CHAINS.find(c => c.id === targetChainId)?.name || 'target'} network`);
      return false;
    }
  };

  const handleWalletConnect = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!connectedWallet) {
        throw new Error("No wallet connected");
      }

      // Validate inputs
      if (!to || !utils.isAddress(to)) {
        throw new Error("Invalid merchant address");
      }

      const paymentAmount = isOpenAmount ? userAmount : amount;
      const parsedAmount = parseFloat(paymentAmount);

      if (isNaN(parsedAmount)) {
        throw new Error("Invalid amount");
      }

      if (parsedAmount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        try {
          await switchChain(chainId);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Failed to switch chains");
          setLoading(false);
          return;
        }
      }

      const walletAddress = await connectedWallet.address;

      // Find token info from stablecoins
      const token = stablecoins.find(
        (sc) =>
          sc.baseToken.toLowerCase() === currency?.toLowerCase() ||
          sc.currency.toLowerCase() === currency?.toLowerCase()
      );

      if (
        token &&
        token.addresses &&
        token.addresses[(chainId || 8453) as keyof typeof token.addresses] && // Default to Base if chainId not specified
        token.addresses[(chainId || 8453) as keyof typeof token.addresses] !== "0x0000000000000000000000000000000000000000"
      ) {
        // ERC-20 transfer
        const tokenAddress = token.addresses[(chainId || 8453) as keyof typeof token.addresses];
        let decimals = token.decimals[(chainId || 8453) as keyof typeof token.decimals] || 18;
        
        let value;
        try {
          value = utils.parseUnits(paymentAmount, decimals as number);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          return;
        }

        // Prepare ERC-20 transfer data
        const erc20Interface = new utils.Interface([
          "function transfer(address to, uint256 amount) public returns (bool)",
        ]);
        
        const data = erc20Interface.encodeFunctionData("transfer", [to, value]);

        // Send transaction using Privy
        const { hash } = await sendTransaction({
          to: tokenAddress as string,
          value: "0",
          data,
        });

        // Save transaction to DB
        const saved = await saveTransactionToDB(
          to,
          walletAddress,
          paymentAmount,
          currency,
          description,
          "Pending",
          hash,
          chainId || 8453
        );

        if (!saved) {
          throw new Error("Failed to record transaction");
        }

        const shortSender = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
        const shortMerchant = to.slice(0, 6) + '...' + to.slice(-4);
        const toastMessage = description
          ? `Payment sent: ${paymentAmount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
          : `Payment sent: ${paymentAmount} ${currency} from ${shortSender} to ${shortMerchant}`;
        
        toast.success(toastMessage, { duration: 3000 });

        // Wait for transaction confirmation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await updateTransactionStatus(
          hash,
          to,
          walletAddress,
          paymentAmount,
          currency,
          description,
          chainId || 8453
        );
        toast.success("Transaction confirmed!");
      } else {
        // Native token transfer
        let value;
        try {
          value = utils.parseEther(paymentAmount);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          return;
        }

        // Send transaction using Privy
        const { hash } = await sendTransaction({
          to,
          value: value.toString(),
        });

        // Save transaction to DB
        const saved = await saveTransactionToDB(
          to,
          walletAddress,
          paymentAmount,
          currency,
          description,
          "Pending",
          hash,
          chainId || 8453
        );

        if (!saved) {
          throw new Error("Failed to record transaction");
        }

        const shortSender = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
        const shortMerchant = to.slice(0, 6) + '...' + to.slice(-4);
        const toastMessage = description
          ? `Payment sent: ${paymentAmount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
          : `Payment sent: ${paymentAmount} ${currency} from ${shortSender} to ${shortMerchant}`;
        
        toast.success(toastMessage, { duration: 3000 });

        // Wait for transaction confirmation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await updateTransactionStatus(
          hash,
          to,
          walletAddress,
          paymentAmount,
          currency,
          description,
          chainId || 8453
        );
        toast.success("Transaction confirmed!");
      }
    } catch (e: any) {
      console.error("WalletConnect error:", e);
      setError(e.message || "WalletConnect transaction failed");
      toast.error(e.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {isOpenAmount && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col space-y-2">
            <label htmlFor="payment-amount" className="text-sm font-medium text-gray-700">
              Enter Payment Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                id="payment-amount"
                value={userAmount}
                onChange={(e) => setUserAmount(e.target.value)}
                min="0"
                step="0.000000000000000001"
                className="block w-full pl-3 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="0.00"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {currency}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Please enter the amount you wish to pay
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleWalletConnect}
        disabled={loading || !connectedWallet || (isOpenAmount && (!userAmount || parseFloat(userAmount) <= 0))}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
          loading || !connectedWallet || (isOpenAmount && (!userAmount || parseFloat(userAmount) <= 0))
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {isOpenAmount ? "Processing Payment..." : "Connecting..."}
          </span>
        ) : (
          isOpenAmount ? `Pay with ${currency}` : `Pay ${amount} ${currency}`
        )}
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {chainId && (
        <div className="text-xs text-gray-500 text-center">
          {SUPPORTED_CHAINS.find(c => c.id === chainId)?.name} (Chain ID: {chainId})
        </div>
      )}
    </div>
  );
}