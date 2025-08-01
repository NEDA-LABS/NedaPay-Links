"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import { stablecoins } from "../../data/stablecoins";
import { utils } from "ethers";
import { Toaster, toast } from 'react-hot-toast';
import { SUPPORTED_CHAINS } from "@/offramp/offrampHooks/constants";
import { usePrivy } from "@privy-io/react-auth";

const WalletConnectButton = dynamic(() => import("./WalletConnectButton"), {
  ssr: false,
});

function isMobile() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

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
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const { ready, authenticated, user } = usePrivy();


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
    provider: ethers.providers.Web3Provider,
    merchantId: string,
    walletAddress: string,
    amount: string,
    currency: string,
    description: string | undefined,
    chainId: number
  ) => {
    try {
      setTxStatus("confirming");
      const receipt = await provider.waitForTransaction(txHash, 1, 120000); // Wait up to 2 minutes
      if (receipt && receipt.status === 1) {
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
      } else {
        setTxStatus("failed");
        setError("Transaction failed on-chain.");
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

  // Check current chain
  useEffect(() => {
    const checkChain = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        setCurrentChainId(network.chainId);
      }
    };

    if (window.ethereum) {
      checkChain();
      (window.ethereum as any).on('chainChanged', (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16));
      });
    }

    return () => {
      if (window.ethereum) {
        (window.ethereum as any).removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const switchChain = async (targetChainId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected");
      }

      const targetChain = SUPPORTED_CHAINS.find(c => c.id === targetChainId);
      if (!targetChain) {
        throw new Error("Unsupported chain");
      }

      await (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      setCurrentChainId(targetChainId);
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          const targetChain = SUPPORTED_CHAINS.find(c => c.id === targetChainId);
          if (!targetChain) {
            throw new Error("Unsupported chain");
          }

          await (window.ethereum as any).request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: targetChain.rpcUrls,
              blockExplorerUrls: targetChain.blockExplorerUrls
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding chain:', addError);
          setError(`Failed to add ${targetChain?.name} network`);
          return false;
        }
      }
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
      if (!window.ethereum) {
        setError("No wallet detected. Please install a Web3 wallet.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }

      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        try {
          await switchChain(chainId);
          const newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const newChainId = await newProvider.getNetwork().then(n => n.chainId);
          setCurrentChainId(newChainId);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Failed to switch chains");
          setLoading(false);
          setTxStatus("failed");
          return;
        }
      }

      await (window.ethereum as any).request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Find token info from stablecoins
      const token = stablecoins.find(
        (sc) =>
          sc.baseToken.toLowerCase() === currency?.toLowerCase() ||
          sc.currency.toLowerCase() === currency?.toLowerCase()
      );

      let txResponse;
      setTxStatus("submitting");

      if (
        token &&
        token.addresses &&
        token.addresses[(chainId || 8453) as keyof typeof token.addresses] && // Default to Base if chainId not specified
        token.addresses[(chainId || 8453) as keyof typeof token.addresses] !== "0x0000000000000000000000000000000000000000"
      ) {
        // ERC-20 transfer
        const erc20ABI = [
          "function transfer(address to, uint256 amount) public returns (bool)",
          "function decimals() public view returns (uint8)",
        ];
        const tokenAddress = token.addresses[(chainId || 8453) as keyof typeof token.addresses];
        const contract = new ethers.Contract(tokenAddress as string, erc20ABI, signer);
        let decimals = token.decimals || 18;
        
        try {
          // Try to get decimals dynamically if not specified
          if (typeof decimals === 'object') {
            decimals = await contract.decimals();
          } else if (!decimals) {
            decimals = await contract.decimals();
          }
        } catch (error) {
          console.warn("Failed to get token decimals, using default:", error);
          decimals = 18;    
        }

        let value;
        try {
          value = utils.parseUnits(amount, decimals as number);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus("failed");
          return;
        }

        try {
          const gasPrice = await provider.getGasPrice();
          const gasLimit = await contract.estimateGas.transfer(to, value);
          const safeGasLimit = gasLimit.mul(120).div(100);

          txResponse = await contract.transfer(to, value, {
            gasPrice,
            gasLimit: safeGasLimit,
          });
        } catch (error: any) {
          console.warn(
            "Gas estimation failed, trying without gas parameters:",
            error
          );
          txResponse = await contract.transfer(to, value);
        }
      } else {
        // Native ETH/coin transfer
        let value;
        try {
          value = utils.parseEther(amount);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus("failed");
          return;
        }

        try {
          const gasPrice = await provider.getGasPrice();
          const gasLimit = await provider.estimateGas({ to, value });
          const safeGasLimit = gasLimit.mul(120).div(100);

          txResponse = await signer.sendTransaction({
            to,
            value,
            gasPrice,
            gasLimit: safeGasLimit,
          });
        } catch (error: any) {
          console.warn(
            "Gas estimation failed, trying without gas parameters:",
            error
          );
          txResponse = await signer.sendTransaction({ to, value });
        }
      }

      setTxHash(txResponse.hash);
      setTxStatus("pending");

      // Save transaction as Pending initially
      const saved = await saveTransactionToDB(
        to,
        walletAddress,
        amount,
        currency,
        description,
        "Pending",
        txResponse.hash,
        chainId || 8453 // Default to Base if chainId not specified
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
        window.dispatchEvent(new CustomEvent('neda-notification', {
          detail: {
            message: toastMessage
          }
        }));
      }

      // Check transaction status
      const confirmed = await checkTransactionStatus(
        txResponse.hash,
        provider,
        to,
        walletAddress,
        amount,
        currency,
        description,
        chainId || 8453 // Default to Base if chainId not specified
      );

      if (!confirmed) {
        // Schedule a retry in the background
        setTimeout(
          () =>
            checkTransactionStatus(
              txResponse.hash,
              provider,
              to,
              walletAddress,
              amount,
              currency,
              description,
              chainId || 8453
            ),
          30000
        ); // Retry after 30 seconds
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
        disabled={loading || (!!chainId && currentChainId !== chainId)}
        className="px-4 py-2 !bg-blue-500 hover:!bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-60"
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

      {/* Mobile wallet options */}
      {!window.ethereum && isMobile() && (
        <div className="mt-4 text-center">
          <div className="mb-2 text-sm text-red-600 dark:text-red-400" style={{color: "red"}}>No wallet detected. Open in your wallet app:</div>
          <div className="flex flex-col gap-2 items-center">
            <a
              href={`metamask://dapp/${typeof window !== 'undefined' ? window.location.host + window.location.pathname + window.location.search : ''}`}
              className="px-4 py-2 !bg-orange-500 hover:!bg-orange-600  dark:!text-white rounded-lg font-semibold transition"
            >
            Open in MetaMask
              
            </a>
            <a
              href={`cbwallet://dapp?url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
              className="px-4 py-2 !bg-blue-600 hover:  !bg-blue-700 dark:!text-white !rounded-lg font-semibold transition"
            >
              Open in Coinbase Wallet
            </a>
            <WalletConnectButton 
              to={to} 
              amount={amount} 
              currency={currency} 
              description={description || ''} 
              chainId={chainId}
            />
          </div>
        </div>
      )}
    </div>
  );
}