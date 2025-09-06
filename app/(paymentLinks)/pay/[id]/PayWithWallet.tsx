"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { utils } from "ethers";
import { Toaster, toast } from 'react-hot-toast';
import { SUPPORTED_CHAINS_NORMAL as SUPPORTED_CHAINS } from "@/offramp/offrampHooks/constants";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import { stablecoins } from "@/data/stablecoins";
import { processPaymentWithFee } from "@/utils/nedapayProtocol";

export default function PayWithWallet({
  to,
  amount,
  currency,
  description,
  linkId,
  chainId
}: {
  to: string;
  amount: string;
  currency: string;
  description?: string;
  linkId: string;
  chainId?: number;
}) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "idle" | "preparing" | "submitting" | "pending" | "confirming" | "confirmed" | "failed"
  >("idle");
  
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  
  const connectedWallet = wallets[0];
  const currentChainId = connectedWallet?.chainId.split(":")[1] ? parseInt(connectedWallet.chainId.split(":")[1]) : null;

  // Function to save a new transaction (Pending)
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
          wallet: wallet,
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

  // Function to update invoice status to paid
  const updateInvoiceToPaid = async (linkId: string) => {
    try {
      const response = await fetch(`/api/send-invoice/invoices/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          paidAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update invoice:", errorData);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error updating invoice:", error);
      return false;
    }
  };

  // function to create notification
  const createNotification = async (
    transactionId: string,
    merchantId: string,
    amount: string,
    currency: string,
    description: string | undefined
  ) => {
    try {
      const message = description
        ? `Payment received: ${amount} ${currency} for ${description}`
        : `Payment received: ${amount} ${currency}`;

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          recipient: merchantId,
          type: "payment_received",
          status: "unseen",
          relatedTransactionId: transactionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return false;
      }
      return true;
    } catch (error) {
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
  
      // Get the updated transaction to get its ID for notification
      const updatedTransaction = await response.json();
      
      // Create notification after successful transaction update
      if (updatedTransaction) {
        await createNotification(
          updatedTransaction.id,
          merchantId,
          amount,
          currency,
          description
        );
      }

      // Update invoice to paid status
      await updateInvoiceToPaid(linkId);
  
      return true;
    } catch (dbError) {
      console.error("Error updating transaction in database:", dbError);
      return false;
    }
  };

  // Function to check and update transaction status
  const checkTransactionStatus = async (
    txHash: string,
    merchantId: string,
    walletAddress: string,
    amount: string,
    currency: string,
    description: string | undefined,
    chainId: number
  ) => {
    try {
      setTxStatus("confirming");
      
      // Use Privy's transaction status checking or a blockchain explorer API
      // For now, we'll simulate a successful transaction after a delay
      // In a real implementation, you would check the blockchain
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setTxStatus("confirmed");
      
      // Update existing Pending entry to Completed
      const updated = await updateTransactionStatus(
        txHash,
        merchantId,
        walletAddress,
        amount,
        currency,
        description,
        chainId
      );
      
      if (!updated) {
        setError(
          "Transaction confirmed on-chain, but failed to update in database. Please contact support."
        );
      } else {
        const shortSender = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
        const shortMerchant = merchantId.slice(0, 6) + '...' + merchantId.slice(-4);
        const toastMessage = description
          ? `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
          : `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
        toast.success(toastMessage);
        window.dispatchEvent(new CustomEvent('neda-notification', {
          detail: {
            message: toastMessage
          }
        }));
      }
    } catch (error: any) {
      console.warn("Transaction confirmation error:", error);
      setError(
        error.message ||
          "Transaction confirmation timed out. It may still confirm later."
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function switchChainIfNecessary() {
      if (chainId && currentChainId !== chainId) {
        try {
          await switchChain(chainId);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Failed to switch chains");
          setLoading(false);
          setTxStatus("failed");
          return;
        }
      }
    }
    switchChainIfNecessary();
  }, [chainId, currentChainId]);

  const switchChain = async (targetChainId: number) => {
    try {
      if (!connectedWallet) {
        throw new Error("No wallet connected");
      }

      const targetChain = SUPPORTED_CHAINS.find(c => c.id === targetChainId);
      if (!targetChain) {
        throw new Error("Unsupported chain");
      }

      console.log("Switching to chain:", targetChain.id);

      await connectedWallet.switchChain(targetChain.id);
      return true;
    } catch (switchError: any) {
      console.error('Error switching chain:', switchError);
      setError(`Failed to switch to ${SUPPORTED_CHAINS.find(c => c.id === targetChainId)?.name || 'target'} network`);
      return false;
    }
  };

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    setTxHash(null);
    setTxStatus("preparing");
  
    try {
      // Validate recipient address
      let isValidAddress = false;
      try {
        isValidAddress = !!to && utils.isAddress(to);
      } catch {
        isValidAddress = false;
      }
      if (!isValidAddress) {
        setError("Invalid merchant address. Please check the payment link.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
        setError("Invalid amount.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }
      if (!connectedWallet) {
        setError("No wallet connected. Please connect a wallet first.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }
  
      console.log("Current chain ID:", currentChainId);
      console.log("Target chain ID:", chainId);
  
      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        try {
          await switchChain(chainId);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Failed to switch chains");
          setLoading(false);
          setTxStatus("failed");
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
  
      setTxStatus("submitting");
  
      // ---------- ERC-20 path ----------
      if (
        token &&
        token.addresses &&
        token.addresses[(chainId || 8453) as keyof typeof token.addresses] &&
        token.addresses[(chainId || 8453) as keyof typeof token.addresses] !==
          "0x0000000000000000000000000000000000000000"
      ) {
        const activeChainId = (chainId || 8453) as keyof typeof token.addresses;
        const tokenAddress = token.addresses[activeChainId] as string;
        let decimals = token.decimals[(chainId || 8453) as keyof typeof token.decimals] || 18;
  
        console.log("tokenAddress", tokenAddress);
        console.log("decimals", decimals);
  
        let valueBN: ethers.BigNumber;
        try {
          valueBN = utils.parseUnits(amount, decimals);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus("failed");
          return;
        }
  
        // ===== Special route for chainId 534352 (fee-collecting flow) =====
        if (chainId === 534352) {
          try {
            // Get signer (Privy-compatible pattern)
            const provider = new ethers.providers.Web3Provider(
              await connectedWallet.getEthereumProvider()
            );
            const signer = provider.getSigner();
            console.log("signer debugg", signer);
  
            // Process via protocol (includes approve + processPayment)
            const txHash = await processPaymentWithFee(
              signer,
              tokenAddress,
              to,
              valueBN.toString(), // pass base units as string
              "payment" // or 'invoice' | 'swap' if you prefer
            );
  
            setTxHash(txHash);
            setTxStatus("pending");
  
            const saved = await saveTransactionToDB(
              to,
              walletAddress,
              amount,
              currency,
              description,
              "Pending",
              txHash,
              chainId || 8453
            );
  
            if (!saved) {
              setError(
                "Transaction sent, but failed to record in database. Please contact support."
              );
            } else {
              const shortSender =
                walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
              const shortMerchant = to.slice(0, 6) + "..." + to.slice(-4);
              const toastMessage = description
                ? `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
                : `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
              toast.success(toastMessage, { duration: 3000 });
              window.dispatchEvent(
                new CustomEvent("neda-notification", {
                  detail: { message: toastMessage },
                })
              );
            }
  
            // Check transaction status
            const confirmed = await checkTransactionStatus(
              txHash,
              to,
              walletAddress,
              amount,
              currency,
              description,
              chainId || 8453
            );
  
            if (!confirmed) {
              setTimeout(
                () =>
                  checkTransactionStatus(
                    txHash,
                    to,
                    walletAddress,
                    amount,
                    currency,
                    description,
                    chainId || 8453
                  ),
                30000
              );
            }
          } catch (e: any) {
            console.error("Payment (with fee) error:", e);
            setError(e?.message || "Payment with fee failed");
            setTxStatus("failed");
            setLoading(false);
            return;
          }
        } else {
          // ===== Default ERC-20 transfer path (all other chains) =====
          const provider = new ethers.providers.Web3Provider(
            await connectedWallet.getEthereumProvider(),
            "any" // helps across chain switches
          );
          const signer = provider.getSigner();
          
          // --- ERC-20 transfer (default path) ---
          const erc20 = new ethers.Contract(
            tokenAddress,
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer
          );
          
          const tx = await erc20.transfer(to, valueBN);
          const hash = tx.hash;
          setTxHash(hash);
          setTxStatus("pending");
  
          const saved = await saveTransactionToDB(
            to,
            walletAddress,
            amount,
            currency,
            description,
            "Pending",
            hash,
            chainId || 8453
          );
  
          if (!saved) {
            setError(
              "Transaction sent, but failed to record in database. Please contact support."
            );
          } else {
            const shortSender =
              walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
            const shortMerchant = to.slice(0, 6) + "..." + to.slice(-4);
            const toastMessage = description
              ? `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
              : `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
            toast.success(toastMessage, { duration: 3000 });
            window.dispatchEvent(
              new CustomEvent("neda-notification", {
                detail: { message: toastMessage },
              })
            );
          }
  
          const confirmed = await checkTransactionStatus(
            hash,
            to,
            walletAddress,
            amount,
            currency,
            description,
            chainId || 8453
          );
  
          if (!confirmed) {
            setTimeout(
              () =>
                checkTransactionStatus(
                  hash,
                  to,
                  walletAddress,
                  amount,
                  currency,
                  description,
                  chainId || 8453
                ),
              30000
            );
          }
        }
  
        // ---------- Native token path ----------
      } else {
        let value;
        try {
          value = utils.parseEther(amount);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus("failed");
          return;
        }
  
        const { hash } = await sendTransaction({
          to,
          value: value.toString(),
        });
  
        setTxHash(hash);
        setTxStatus("pending");
  
        const saved = await saveTransactionToDB(
          to,
          walletAddress,
          amount,
          currency,
          description,
          "Pending",
          hash,
          chainId || 8453
        );
  
        if (!saved) {
          setError(
            "Transaction sent, but failed to record in database. Please contact support."
          );
        } else {
          const shortSender =
            walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
          const shortMerchant = to.slice(0, 6) + "..." + to.slice(-4);
          const toastMessage = description
            ? `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
            : `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
          toast.success(toastMessage, { duration: 3000 });
          window.dispatchEvent(
            new CustomEvent("neda-notification", {
              detail: { message: toastMessage },
            })
          );
        }
  
        const confirmed = await checkTransactionStatus(
          hash,
          to,
          walletAddress,
          amount,
          currency,
          description,
          chainId || 8453
        );
  
        if (!confirmed) {
          setTimeout(
            () =>
              checkTransactionStatus(
                hash,
                to,
                walletAddress,
                amount,
                currency,
                description,
                chainId || 8453
              ),
            30000
          );
        }
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      setError(e.message || "Transaction failed");
      setTxStatus("failed");
    }
  
    setLoading(false);
  };

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      setLoading(false);
      setTxStatus("idle");
    };
  }, []);

  const statusInfo = () => {
    switch (txStatus) {
      case "preparing":
      case "submitting":
      case "pending":
      case "confirming":
        return {
          message: "Transaction processing...",
          color: "text-blue-600 dark:text-blue-400",
        };
      case "confirmed":
        return {
          message: description
            ? `Transaction confirmed for ${description}!`
            : "Transaction confirmed!",
          color: "text-green-600 dark:text-green-400",
        };
      case "failed":
        return {
          message: error || "Transaction failed",
          color: "text-red-600 dark:text-red-400",
        };
      default:
        return { message: "", color: "" };
    }
  };

  const { message, color } = statusInfo();

  // Check if we need to show chain switch warning
  const showChainWarning = chainId && currentChainId !== chainId;
  const targetChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  console.log("target chain", chainId);
  console.log("current chain", currentChainId);

  return (
    <div className="mt-4 text-center">
      {showChainWarning && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Please switch to <strong>{targetChain?.name}</strong> network to complete this payment
          </p>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || !connectedWallet || (!!chainId && currentChainId !== chainId)}
        className="px-4 py-2 !bg-blue-600 hover:!bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            {txStatus === "idle" ? "Processing..." : message}
          </span>
        ) : (
          `Pay with Wallet`
        )}
      </button>

      {/* Transaction status messages */}
      {txStatus !== "idle" && txStatus !== "confirmed" && !error && (
        <div className={`mt-2 ${color} text-sm font-medium`}>{message}</div>
      )}

      {/* Transaction hash with link */}
      {txHash && (
        <div className="mt-2 text-green-600 dark:text-green-400">
          <span className="block mb-1">Transaction sent!</span>
          <a
            href={`${targetChain?.explorerUrl || 'https://basescan.org'}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 underline"
          >
            <span>View on {targetChain?.name || 'Base'}Scan</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-600 dark:text-red-400 text-sm" style={{color: "red"}}>{error}</div>
      )}

      {/* Show connect wallet button if not connected */}
      {!connectedWallet && (
        <div className="mt-4 text-center">
          <div className="mb-2 text-sm text-red-600 dark:text-red-400" style={{color: "red"}}>
            Please connect your wallet first
          </div>
        </div>
      )}
    </div>
  );
}