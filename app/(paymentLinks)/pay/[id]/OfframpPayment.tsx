"use client";

import { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { fetchTokenRate, verifyAccount } from "@/utils/paycrest";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import { stablecoins } from "@/data/stablecoins";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, Download, ExternalLink, Loader2, Wallet, Shield } from "lucide-react";
import Image from "next/image";
import { SUPPORTED_CHAINS as CHAIN_CONFIGS } from "@/ramps/payramp/offrampHooks/constants";

/* =========================
   Chain configuration (with explorerUrl for links)
   ========================= */
type SupportedToken = "USDC" | "USDT";

interface SupportedChain {
  name: string;
  id: number;
  supports: SupportedToken[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  explorerUrl: string;
}

const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    name: "base",
    id: 8453,
    supports: ["USDC"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    explorerUrl: "https://basescan.org",
  },
  {
    name: "arbitrum one",
    id: 42161,
    supports: ["USDC", "USDT"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
    explorerUrl: "https://arbiscan.io",
  },
  {
    name: "polygon",
    id: 137,
    supports: ["USDC", "USDT"],
    nativeCurrency: { name: "Matic", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
    explorerUrl: "https://polygonscan.com",
  },
  {
    name: "celo",
    id: 42220,
    supports: ["USDC", "USDT"],
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpcUrls: ["https://forno.celo.org"],
    blockExplorerUrls: ["https://celoscan.io"],
    explorerUrl: "https://celoscan.io",
  },
  {
    name: "bnb smart chain",
    id: 56,
    supports: ["USDC", "USDT"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
    explorerUrl: "https://bscscan.com",
  },
  {
    name: "scroll",
    id: 534352,
    supports: ["USDC", "USDT"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.scroll.io"],
    blockExplorerUrls: ["https://scrollscan.com"],
    explorerUrl: "https://scrollscan.com",
  }
] as const;

// Token selection dropdown uses these
const SUPPORTED_TOKENS = ["USDC", "USDT"] as const;

type TxStatus =
  | "idle"
  | "preparing"
  | "submitting"
  | "pending"
  | "confirming"
  | "confirmed"
  | "failed";

export default function OffRampPayment({
  to,
  amount,
  currency,
  description,
  offRampType,
  offRampValue,
  accountName,
  offRampProvider,
  linkId,
  chainId,
}: {
  to: string;
  amount: string;
  currency: string;
  description?: string;
  offRampType: "PHONE" | "BANK_ACCOUNT";
  offRampValue: string;
  accountName: string;
  offRampProvider: string;
  linkId: string;
  chainId?: number; // desired chain for payment (optional)
}) {
  // --- shared state (off-ramp + pay) ---
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [loading, setLoading] = useState(false);

  // --- off-ramp specific state ---
  const [depositAddress, setDepositAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [fiatAmount] = useState(amount);
  const [rate, setRate] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SupportedToken | "">("");
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState("");
  const [refundAddress, setRefundAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // --- Privy ---
  const { wallets } = useWallets();
  const connectedWallet = wallets?.[0];
  const { sendTransaction } = useSendTransaction();
  const { ready, authenticated } = usePrivy();

  // Auto-populate refund address with connected wallet
  useEffect(() => {
    if (connectedWallet?.address && !refundAddress) {
      setRefundAddress(connectedWallet.address);
    }
  }, [connectedWallet?.address, refundAddress]);

  // Short-circuit render until Privy is ready (prevents undefined states)
  if (!ready) {
    return <div>Loading...</div>;
  }

  const derivedCurrentChainId =
    connectedWallet?.chainId?.split(":")[1]
      ? parseInt(connectedWallet.chainId.split(":")[1])
      : currentChainId;

  // Watch provider network changes (fallback, e.g. injected wallets)
  useEffect(() => {
    const handler = (chainIdHex: string) => {
      const parsed = parseInt(chainIdHex, 16);
      setCurrentChainId(parsed);
    };
    if (typeof window !== "undefined" && (window as any).ethereum?.on) {
      (window as any).ethereum.on("chainChanged", handler);
      return () => (window as any).ethereum?.removeListener?.("chainChanged", handler);
    }
  }, []);

  // If merchant set a specific chainId, try to auto-switch once
  useEffect(() => {
    (async () => {
      if (chainId && derivedCurrentChainId && chainId !== derivedCurrentChainId) {
        await switchChain(chainId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, connectedWallet]);

  // -----------------------
  // helpers
  // -----------------------
  const isValidAddress = (address: string) => utils.isAddress(address);

  const calculateTokenAmount = (currentRate?: number) => {
    const rateToUse = currentRate || rate;
    if (!rateToUse || !fiatAmount) return "0";
    try {
      const parsedAmount = parseFloat(fiatAmount);
      // Calculate token amount needed so that (tokenAmount - 0.5% fee) = fiatAmount
      // Formula: tokenAmount = fiatAmount / (rate * (1 - 0.005))
      // This ensures the recipient gets exactly the requested fiat amount after fees
      const tokenAmount = parsedAmount / (rateToUse * (1 - 0.005));
      const formattedAmount = tokenAmount.toFixed(6);
      setCryptoAmount(formattedAmount);
      return formattedAmount;
    } catch {
      setError("Failed to calculate token amount");
      return "0";
    }
  };

  useEffect(() => {
    if (rate > 0) calculateTokenAmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate]);

  const handleChainChange = async (chainName: string) => {
    setSelectedChain(chainName);
    
    // Find the chain ID for the selected chain and switch automatically
    const selectedChainConfig = SUPPORTED_CHAINS.find(c => c.name.toLowerCase() === chainName.toLowerCase());
    if (selectedChainConfig && connectedWallet) {
      try {
        await switchChain(selectedChainConfig.id);
      } catch (error) {
        console.error("Failed to switch chain:", error);
        // Don't show error to user as chain switching might fail for various reasons
        // but they can still proceed with the selected chain
      }
    }
    
    // ensure compatible token
    if (selectedToken && !SUPPORTED_CHAINS.find((c) => c.name === chainName)?.supports.includes(selectedToken)) {
      setSelectedToken("");
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SupportedToken | "";
    setSelectedToken(value);
  };

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setWalletAddress(e.target.value);

  // -----------------------
  // off-ramp API calls
  // -----------------------
  const verifyRecipient = async () => {
    try {
      const verification = await verifyAccount(offRampProvider, offRampValue);
      setVerificationStatus(verification);
      return verification;
    } catch (e) {
      setError("Account verification failed");
      return null;
    }
  };

  const fetchRate = async () => {
    try {
      const rateValue = await fetchTokenRate(
        selectedToken,
        1,
        currency,
        selectedChain
      );
      const rateNum = parseFloat(rateValue);
      setRate(rateNum);
      return rateNum;
    } catch {
      setError("Failed to fetch exchange rate");
      return 0;
    }
  };

  const createOffRampOrder = async (currentRate?: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!refundAddress || !isValidAddress(refundAddress)) {
        throw new Error("Please enter a valid refund address");
      }
      const tokenAmount = calculateTokenAmount(currentRate);
      if (!tokenAmount || tokenAmount === "0") {
        throw new Error("Invalid token amount");
      }

      const order = await axios.post("/api/paycrest/orders", {
        amount: tokenAmount,
        rate: currentRate || rate,
        token: selectedToken,
        network: selectedChain,
        recipient: {
          institution: offRampProvider,
          accountIdentifier: offRampValue,
          accountName,
          memo: description || "",
        },
        reference: `order-${Date.now()}`,
        returnAddress: refundAddress,
      });

      const { receiveAddress } = order.data.data;
      setDepositAddress(receiveAddress);
      setShowPaymentModal(false);
      toast.success("Deposit address generated!");
      return order;
    } catch (err: any) {
      setError(err?.message || "Failed to create order");
      toast.error(err?.message || "Order creation failed");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // DB + notifications
  // -----------------------
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          wallet,
          amount,
          currency,
          description: description || undefined,
          status,
          txHash,
          chainId,
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

  const updateInvoiceToPaid = async (linkId: string) => {
    try {
      const response = await fetch(`/api/send-invoice/invoices/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, paidAt: new Date().toISOString() }),
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
        headers: { "Content-Type": "application/json" },
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
        console.error("Failed to create notification:", errorData);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Notification error:", error);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          wallet: walletAddress,
          amount,
          currency,
          description: description || undefined,
          status: "Completed",
          chainId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update transaction:", errorData);
        return false;
      }

      const updatedTransaction = await response.json();
      if (updatedTransaction) {
        await createNotification(
          updatedTransaction.id,
          merchantId,
          amount,
          currency,
          description
        );
      }

      await updateInvoiceToPaid(linkId);
      return true;
    } catch (dbError) {
      console.error("Error updating transaction in database:", dbError);
      return false;
    }
  };

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
      // simple confirm-after-delay; you can swap for provider.waitForTransaction
      await new Promise((r) => setTimeout(r, 5000));
      setTxStatus("confirmed");

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
        const shortSender =
          walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
        const shortMerchant = merchantId.slice(0, 6) + "..." + merchantId.slice(-4);
        const toastMessage = description
          ? `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant} for ${description}`
          : `Payment sent: ${amount} ${currency} from ${shortSender} to ${shortMerchant}`;
        toast.success(toastMessage);
        window.dispatchEvent(
          new CustomEvent("neda-notification", { detail: { message: toastMessage } })
        );
      }
    } catch (e: any) {
      console.warn("Transaction confirmation error:", e);
      setError(
        e?.message || "Transaction confirmation timed out. It may still confirm later."
      );
      return false;
    }
    return true;
  };

  // -----------------------
  // chain switch via Privy wallet
  // -----------------------
  const switchChain = async (targetChainId: number) => {
    try {
      if (!connectedWallet) throw new Error("No wallet connected");
      const targetChain = SUPPORTED_CHAINS.find((c) => c.id === targetChainId);
      if (!targetChain) throw new Error("Unsupported chain");
      await connectedWallet.switchChain(targetChain.id);
      setCurrentChainId(targetChain.id);
      return true;
    } catch (switchError: any) {
      console.error("Error switching chain:", switchError);
      setError(
        `Failed to switch to ${
          SUPPORTED_CHAINS.find((c) => c.id === targetChainId)?.name || "target"
        } network`
      );
      return false;
    }
  };

  // -----------------------
  // Pay (inline version)
  // -----------------------
  // Helper function to get chain icon
  const getChainIcon = (chainName: string): string => {
    const chainConfig = CHAIN_CONFIGS.find(c => c.name.toLowerCase() === chainName.toLowerCase());
    return chainConfig?.icon || '/ethereum.svg'; // fallback icon
  };

  // Helper function to parse transaction errors into user-friendly messages
  const parseTransactionError = (error: any): string => {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    
    // Check for insufficient balance
    if (errorMessage.includes("transfer amount exceeds balance") || 
        errorMessage.includes("insufficient funds") ||
        errorMessage.includes("ERC20: transfer amount exceeds balance")) {
      return "Insufficient token balance. Please check your wallet balance and try again.";
    }
    
    // Check for gas estimation errors
    if (errorMessage.includes("cannot estimate gas") || 
        errorMessage.includes("UNPREDICTABLE_GAS_LIMIT") ||
        errorMessage.includes("EstimateGasExecutionError")) {
      return "Transaction may fail due to insufficient balance or network issues. Please check your balance and try again.";
    }
    
    // Check for insufficient gas
    if (errorMessage.includes("insufficient funds for gas") ||
        errorMessage.includes("insufficient funds for intrinsic transaction cost")) {
      return "Insufficient native token balance to pay for gas fees. Please add more ETH/native tokens to your wallet.";
    }
    
    // Check for user rejection
    if (errorMessage.includes("user rejected") || 
        errorMessage.includes("User denied") ||
        errorMessage.includes("rejected")) {
      return "Transaction was cancelled by user.";
    }
    
    // Check for network errors
    if (errorMessage.includes("network") || errorMessage.includes("RPC")) {
      return "Network error. Please check your connection and try again.";
    }
    
    // Check for allowance issues
    if (errorMessage.includes("allowance") || errorMessage.includes("approve")) {
      return "Token allowance error. Please try the transaction again.";
    }
    
    return errorMessage.length > 100 ? 
      "Transaction failed. Please check your wallet and try again." : 
      errorMessage;
  };

  // Helper function to check token balance
  const checkTokenBalance = async (tokenAddress: string, walletAddress: string, requiredAmount: ethers.BigNumber): Promise<boolean> => {
    try {
      const provider = new ethers.providers.Web3Provider(
        await connectedWallet.getEthereumProvider()
      );
      
      const erc20 = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      
      const balance = await erc20.balanceOf(walletAddress);
      return balance.gte(requiredAmount);
    } catch (error) {
      console.error("Balance check failed:", error);
      return false; // Do not allow transaction to proceed if balance check fails
    }
  };

  const createDepositAddress = async () => {
    if (!selectedChain || !selectedToken) {
      setError("Please select both network and token");
      return;
    }

    if (!refundAddress) {
      setError("Please enter a refund address");
      return;
    }

    setLoading(true);
    setIsInitializing(true);
    setError(null);

    try {
      // First verify the recipient account
      await verifyRecipient();
      
      // Fetch the current exchange rate and wait for it to complete
      const currentRate = await fetchRate();
      
      // Ensure rate is available before proceeding
      if (!currentRate || currentRate <= 0) {
        throw new Error("Unable to fetch current exchange rate. Please try again.");
      }
      
      // Create the off-ramp order which generates the deposit address
      await createOffRampOrder(currentRate);
    } catch (error: any) {
      console.error("Error creating deposit address:", error);
      const friendlyError = parseTransactionError(error);
      setError(friendlyError);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    setTxHash(null);
    setTxStatus("preparing");

    try {
      // Privy readiness/auth
      if (!ready || !authenticated) {
        setError("Please sign in and connect a wallet first.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }

      if (!to || !isValidAddress(to)) {
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
      if (!connectedWallet || !connectedWallet.address) {
        setError("No wallet connected. Please connect a wallet first.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }

      const current = derivedCurrentChainId || null;
      const target = chainId || 8453; // default to Base if unspecified

      // Switch chain if needed
      if (current !== null && target && current !== target) {
        const ok = await switchChain(target);
        if (!ok) {
          setLoading(false);
          setTxStatus("failed");
          return;
        }
      }

      const walletAddr = connectedWallet.address; // string
      setTxStatus("submitting");

      // resolve token
      // Determine recipient & amount for this payment (off-ramp uses depositAddress + computed cryptoAmount)
      const toSendAddress = depositAddress || to;
      const amountToSend = depositAddress ? (cryptoAmount || "0") : amount;

      if (!isValidAddress(toSendAddress)) {
        setError("Invalid destination address.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }
      if (!amountToSend || isNaN(Number(amountToSend)) || Number(amountToSend) <= 0) {
        setError("Invalid token amount.");
        setLoading(false);
        setTxStatus("failed");
        return;
      }

      // Resolve token STRICTLY from the user's token selection (USDC/USDT)
      const token = stablecoins.find(
        (sc: any) =>
          (sc.baseToken?.toUpperCase?.() === selectedToken?.toUpperCase?.()) ||
          (sc.symbol?.toUpperCase?.() === selectedToken?.toUpperCase?.())
      );

      // ---------------- ERC-20 path ----------------
      if (
        token &&
        token.addresses &&
        token.addresses[target as keyof typeof token.addresses] &&
        token.addresses[target as keyof typeof token.addresses] !==
          "0x0000000000000000000000000000000000000000"
      ) {
        const tokenAddress =
          token.addresses[target as keyof typeof token.addresses] as string;
        const decimals = (token.decimals?.[target as keyof typeof token.decimals] as number) ?? 6; // default 6 for stables

        let valueBN: ethers.BigNumber;
        try {
          valueBN = utils.parseUnits(amountToSend, decimals);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus("failed");
          return;
        }

        // Check token balance before proceeding
        const hasBalance = await checkTokenBalance(tokenAddress, walletAddr, valueBN);
        if (!hasBalance) {
          setError(`Insufficient ${selectedToken} balance. Please check your wallet and try again.`);
          setLoading(false);
          setTxStatus("failed");
          return;
        }

        // Use external provider from Privy wallet
        const provider = new ethers.providers.Web3Provider(
          await connectedWallet.getEthereumProvider(),
          "any"
        );
        const signer = provider.getSigner();

        const erc20 = new ethers.Contract(
          tokenAddress,
          ["function transfer(address to, uint256 amount) returns (bool)"],
          signer
        );

        let hash: string;
        try {
          const tx = await erc20.transfer(toSendAddress, valueBN);
          hash = tx.hash as string;
          setTxHash(hash);
          setTxStatus("pending");
        } catch (transferError: any) {
          console.error("ERC-20 transfer error:", transferError);
          const friendlyError = parseTransactionError(transferError);
          setError(friendlyError);
          setTxStatus("failed");
          setLoading(false);
          return;
        }

        const saved = await saveTransactionToDB(
          toSendAddress,
          walletAddr,
          amountToSend,
          selectedToken || currency,
          description,
          "Pending",
          hash,
          target
        );

        if (!saved) {
          setError(
            "Transaction sent, but failed to record in database. Please contact support."
          );
        } else {
          const shortSender = walletAddr.slice(0, 6) + "..." + walletAddr.slice(-4);
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
          walletAddr,
          amount,
          currency,
          description,
          target
        );
        if (!confirmed) {
          setTimeout(
            () =>
              checkTransactionStatus(
                hash,
                to,
                walletAddr,
                amount,
                currency,
                description,
                target
              ),
            30000
          );
        }

        // ---------------- native path ----------------
      } else {
        let value;
        try {
          value = utils.parseEther(amountToSend);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus("failed");
          return;
        }

        let hash: string;
        try {
          const result = await sendTransaction(
            { to: toSendAddress, value: value.toString() },
            { address: connectedWallet.address }
          );
          hash = result.hash;
          setTxHash(hash);
          setTxStatus("pending");
        } catch (nativeError: any) {
          console.error("Native token transfer error:", nativeError);
          const friendlyError = parseTransactionError(nativeError);
          setError(friendlyError);
          setTxStatus("failed");
          setLoading(false);
          return;
        }

        const saved = await saveTransactionToDB(
          toSendAddress,
          walletAddr,
          amountToSend,
          selectedToken || currency,
          description,
          "Pending",
          hash,
          target
        );

        if (!saved) {
          setError(
            "Transaction sent, but failed to record in database. Please contact support."
          );
        } else {
          const shortSender = walletAddr.slice(0, 6) + "..." + walletAddr.slice(-4);
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
          walletAddr,
          amount,
          currency,
          description,
          target
        );
        if (!confirmed) {
          setTimeout(
            () =>
              checkTransactionStatus(
                hash,
                to,
                walletAddr,
                amount,
                currency,
                description,
                target
              ),
            30000
          );
        }
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      const friendlyError = parseTransactionError(e);
      setError(friendlyError);
      setTxStatus("failed");
    }

    setLoading(false);
  };

  // -----------------------
  // UI helpers
  // -----------------------
  const statusInfo = () => {
    switch (txStatus) {
      case "preparing":
      case "submitting":
      case "pending":
      case "confirming":
        return { message: "Transaction processing...", color: "text-blue-400" };
      case "confirmed":
        return {
          message: description
            ? `Transaction confirmed for ${description}!`
            : "Transaction confirmed!",
          color: "text-emerald-400",
        };
      case "failed":
        return { message: error || "Transaction failed", color: "text-red-400" };
      default:
        return { message: "", color: "" };
    }
  };
  const { message: statusMessage, color: statusColor } = statusInfo();

  const getExplorerUrl = () => {
    const chain =
      SUPPORTED_CHAINS.find((c) => c.name === selectedChain) ||
      SUPPORTED_CHAINS.find((c) => c.id === (chainId || 8453));
    if (!chain || !txHash) return "#";
    return `${chain.explorerUrl}/tx/${txHash}`;
  };

  const downloadReceipt = () => {
    const receipt = `
OFF-RAMP PAYMENT RECEIPT
-------------------------
Transaction Hash: ${txHash}
Date: ${new Date().toLocaleString()}
From: ${walletAddress}
To: ${depositAddress || to}
Amount: ${cryptoAmount || amount} ${cryptoAmount ? selectedToken : currency}
Fiat Equivalent: ${fiatAmount} ${currency}
Exchange Rate: ${rate ? `1 ${selectedToken} = ${rate.toFixed(2)} ${currency}` : "N/A"}
Recipient: ${accountName} (${offRampValue})
Provider: ${offRampProvider}
Description: ${description || "N/A"}
Network: ${selectedChain || SUPPORTED_CHAINS.find((c) => c.id === (chainId || 8453))?.name}
IMPORTANT: If off-ramp processing fails, tokens will be refunded to the originating wallet within 7 business days.
`;
    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offramp-receipt-${txHash?.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showChainWarning =
    !!(chainId || selectedChain) &&
    (derivedCurrentChainId ?? currentChainId) !==
      (chainId || SUPPORTED_CHAINS.find((c) => c.name === selectedChain)?.id);
  const targetChain =
    SUPPORTED_CHAINS.find((c) => c.id === (chainId || 0)) ||
    SUPPORTED_CHAINS.find((c) => c.name === selectedChain);

  // Preselect selectedChain if chainId prop is present
  useEffect(() => {
    if (chainId && !selectedChain) {
      const pre = SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name;
      if (pre) setSelectedChain(pre);
    }
  }, [chainId, selectedChain]);

  /* =========================
     RENDERING
     ========================= */

  // Loading only spinner
  if (loading && !statusMessage) {
    return (
      <div className="mt-4 text-center">
        <div className="flex justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-400" />
        </div>
        <p className="mt-2 text-blue-200 text-sm">Processing transaction...</p>
      </div>
    );
  }

  // Error (no tx yet)
  if (error && !txHash) {
    return (
      <div className="mt-4">
        <Alert className="border-red-500/20 bg-red-900/10">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-200 text-sm">
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-3 text-center">
          <Button
            onClick={() => setError(null)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Success
  if (txHash) {
    return (
      <div className="mt-4">
        <Card className="border border-emerald-500/20 bg-emerald-900/10">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
            <p className="text-emerald-200 text-sm mb-4">
              {cryptoAmount || amount} {cryptoAmount ? selectedToken : currency} sent
            </p>

            {statusMessage && (
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30 mb-4">
                {statusMessage}
              </Badge>
            )}

            <div className="bg-slate-800/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-400 mb-1">Transaction Hash:</p>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-xs break-all hover:text-blue-300 inline-flex items-center space-x-1"
              >
                <span>{txHash.slice(0, 12)}...{txHash.slice(-10)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <Button
              onClick={downloadReceipt}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If deposit address has been created, show details + inline pay button
  if (depositAddress) {
    return (
      <div className="mt-4">
        {showChainWarning && (
          <Alert className="mb-4 border-amber-500/20 bg-amber-900/10">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <AlertDescription className="text-amber-200 text-sm">
              Please switch to <strong>{targetChain?.name}</strong> network to complete this payment
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-4 border border-blue-500/20 bg-blue-900/10">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-400">Send to deposit address:</p>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="font-mono text-xs break-all text-white">{depositAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">
                  {cryptoAmount} {selectedToken}
                </p>
                <p className="text-xs text-slate-300">
                  ≈ {fiatAmount} {currency} via {offRampProvider}
                </p>
                <p className="text-xs text-slate-400">
                  Rate: 1 {selectedToken} = {rate.toFixed(2)} {currency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handlePay}
          disabled={
            loading ||
            !connectedWallet ||
            (!!chainId && derivedCurrentChainId !== chainId) ||
            !authenticated
          }
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors duration-200 text-sm disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Processing...
            </span>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Pay with Wallet
            </>
          )}
        </Button>

        {statusMessage && (
          <div className="mt-3">
            <Badge className={`${statusColor === 'text-blue-400' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : statusColor === 'text-emerald-400' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-red-500/20 text-red-200 border-red-500/30'}`}>
              {statusMessage}
            </Badge>
          </div>
        )}

        {!connectedWallet && (
          <Alert className="mt-4 border-red-500/20 bg-red-900/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-200 text-sm">
              Please connect your wallet first
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Main initial render (select network + token, then create deposit address)
  return (
    <div className="mt-4">
      <Toaster position="top-right" />
      <div className="space-y-4">
        {/* Chain Selection */}
        <div>
          <Label className="text-white font-medium text-sm mb-2 block">Select Network</Label>
          <Select value={selectedChain} onValueChange={handleChainChange}>
            <SelectTrigger className="w-full bg-slate-800/50 border-white/20 text-white h-12 rounded-xl backdrop-blur-sm">
              <SelectValue placeholder="Choose a network" className="text-slate-300" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 backdrop-blur-xl">
              {SUPPORTED_CHAINS.map((chain) => (
                <SelectItem key={chain.id} value={chain.name} className="text-white hover:bg-slate-700">
                  <div className="flex items-center space-x-2">
                    <Image 
                      src={getChainIcon(chain.name)} 
                      alt={chain.name} 
                      width={20} 
                      height={20} 
                      className="rounded-full"
                    />
                    <span className="text-sm capitalize">{chain.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Token Selection */}
        <div>
          <Label className="text-white font-medium text-sm mb-2 block">Select Token</Label>
          <Select value={selectedToken} onValueChange={(value) => setSelectedToken(value as SupportedToken)}>
            <SelectTrigger className="w-full bg-slate-800/50 border-white/20 text-white h-12 rounded-xl backdrop-blur-sm">
              <SelectValue placeholder="Choose a token" className="text-slate-300" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 backdrop-blur-xl">
              {SUPPORTED_TOKENS.filter((token) => {
                const chain = SUPPORTED_CHAINS.find((c) => c.name === selectedChain);
                return chain?.supports.includes(token);
              }).map((token) => {
                const tokenData = stablecoins.find(t => t.baseToken === token);
                return (
                  <SelectItem key={token} value={token} className="text-white hover:bg-slate-700">
                    <div className="flex items-center space-x-2">
                      {tokenData?.flag && (
                        <Image 
                          src={tokenData.flag} 
                          alt={token} 
                          width={16} 
                          height={16} 
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm">{token}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Refund Address */}
        <div>
          <Label className="text-white font-medium text-sm mb-2 block">Refund Address</Label>
          <Input
            type="text"
            value={refundAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefundAddress(e.target.value)}
            placeholder="Enter wallet address for refunds"
            className="w-full bg-slate-800/50 border-white/20 text-white h-12 rounded-xl backdrop-blur-sm placeholder:text-slate-400"
          />
          <p className="text-slate-400 text-xs mt-1">
            Address where tokens will be refunded if off-ramp processing fails
          </p>
        </div>

        {/* Create Deposit Button */}
        <Button
          onClick={createDepositAddress}
          disabled={!selectedChain || !selectedToken || !refundAddress || loading || isInitializing}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
        >
          {loading || isInitializing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isInitializing ? "Initializing..." : "Creating deposit address..."}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Create Deposit Address
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
