"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from 'react-hot-toast';

export default function WalletConnectButton({ to, amount, currency, description }: { to: string; amount: string; currency: string; description?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to save a new transaction (Pending)
  const saveTransactionToDB = async (
    merchantId: string,
    walletAddress: string,
    amount: string,
    currency: string,
    description: string | undefined,
    status: "Pending" | "Completed",
    txHash: string
  ) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId,
          wallet: walletAddress,
          amount,
          currency,
          description: description || undefined,
          status,
          txHash,
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

  // Function to update transaction status to Completed
  const updateTransactionStatus = async (
    txHash: string,
    merchantId: string,
    walletAddress: string,
    amount: string,
    currency: string,
    description: string | undefined
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

  const handleWalletConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const WalletConnectProvider = (await import("@walletconnect/web3-provider")).default;
      const provider = new WalletConnectProvider({
        rpc: {
          1: "https://mainnet.infura.io/v3/0ba1867b1fc0af11b0cf14a0ec8e5b0f", // User's Infura Project ID
        },
      });
      await provider.enable();
      // Use ethers.js with WalletConnect provider
      const { ethers } = await import("ethers");
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const signer = web3Provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Validate recipient address
      if (!ethers.utils.isAddress(to)) {
        setError("Invalid merchant address. Please check the payment link.");
        setLoading(false);
        return;
      }

      // Validate amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError("Invalid amount.");
        setLoading(false);
        return;
      }

      // Send transaction (native ETH for now)
      let value;
      try {
        value = ethers.utils.parseEther(amount);
      } catch {
        setError("Invalid amount format.");
        setLoading(false);
        return;
      }

      const tx = await signer.sendTransaction({
        to,
        value,
      });

      const txHash = tx.hash;

      // Save transaction as Pending
      const saved = await saveTransactionToDB(
        to,
        walletAddress,
        amount,
        currency,
        description,
        "Pending",
        txHash
      );

      if (!saved) {
        setError(
          "Transaction sent, but failed to record in database. Please contact support."
        );
      } else {
        const shortSender = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
        const shortMerchant = to.slice(0, 6) + '...' + to.slice(-4);
        const toastMessage = description
          ? `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
          : `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
        toast.success(toastMessage, {
          duration: 3000,
        });
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      if (receipt && receipt.status === 1) {
        // Update transaction to Completed
        const updated = await updateTransactionStatus(
          txHash,
          to,
          walletAddress,
          amount,
          currency,
          description
        );
        if (!updated) {
          setError(
            "Transaction confirmed on-chain, but failed to update in database. Please contact support."
          );
        } else {
          const shortSender = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
          const shortMerchant = to.slice(0, 6) + '...' + to.slice(-4);
          const toastMessage = description
            ? `Transaction confirmed: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
            : `Transaction confirmed: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
          toast.success(toastMessage);
        }
      } else {
        setError("Transaction failed on-chain.");
      }

      setLoading(false);
    } catch (e: any) {
      console.error("WalletConnect error:", e);
      setError(e.message || "WalletConnect transaction failed");
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 text-center">
      <button
        onClick={handleWalletConnect}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-60"
      >
        {loading ? "Connecting..." : "Pay with WalletConnect"}
      </button>
      {error && <div className="mt-2 text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}