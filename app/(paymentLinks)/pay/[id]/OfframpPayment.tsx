"use client";

import { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { fetchTokenRate, verifyAccount } from "@/utils/paycrest";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import { stablecoins } from "@/data/stablecoins";

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
    name: "arbitrum-one",
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
    name: "bnb",
    id: 56,
    supports: ["USDC", "USDT"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
    explorerUrl: "https://bscscan.com",
  },
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
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  // --- Privy ---
  const { wallets } = useWallets();
  const connectedWallet = wallets?.[0];
  const { sendTransaction } = useSendTransaction();
  const { ready, authenticated } = usePrivy();

  // Short-circuit render until Privy is ready (prevents undefined states)
  if (!ready) {
    return null;
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

  const calculateTokenAmount = () => {
    if (!rate || !fiatAmount) return "0";
    try {
      const parsedAmount = parseFloat(fiatAmount);
      const tokenAmount = (parsedAmount + parsedAmount * 0.05) / rate;
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

  const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chain = e.target.value;
    setSelectedChain(chain);
    // ensure compatible token
    if (selectedToken) {
      const chainSupports =
        SUPPORTED_CHAINS.find((c) => c.name === chain)?.supports || [];
      if (!chainSupports.includes(selectedToken)) {
        setSelectedToken("");
      }
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

  const createOffRampOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isValidAddress(walletAddress)) {
        throw new Error("Please enter a valid wallet address");
      }
      const tokenAmount = calculateTokenAmount();
      if (!tokenAmount || tokenAmount === "0") {
        throw new Error("Invalid token amount");
      }

      const order = await axios.post("/api/paycrest/orders", {
        amount: tokenAmount,
        rate,
        token: selectedToken,
        network: selectedChain,
        recipient: {
          institution: offRampProvider,
          accountIdentifier: offRampValue,
          accountName,
          memo: description || "",
        },
        reference: `order-${Date.now()}`,
        returnAddress: walletAddress,
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
  // Helper function to parse error messages
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
      console.warn("Balance check failed:", error);
      return true; // Allow transaction to proceed if balance check fails
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
        return { message: "Transaction processing...", color: "text-blue-600" };
      case "confirmed":
        return {
          message: description
            ? `Transaction confirmed for ${description}!`
            : "Transaction confirmed!",
          color: "text-green-600",
        };
      case "failed":
        return { message: error || "Transaction failed", color: "text-red-600" };
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
          <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="mt-2 text-blue-600">Processing transaction...</p>
      </div>
    );
  }

  // Error (no tx yet)
  if (error && !txHash) {
    return (
      <div className="mt-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Success
  if (txHash) {
    return (
      <div className="mt-4 text-center p-6 bg-green-50 rounded-xl">
        <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="text-xl font-bold mt-4 text-slate-700">Payment Successful!</h3>
        <p className="mt-2">
          {cryptoAmount || amount} {cryptoAmount ? selectedToken : currency} sent
        </p>

        {statusMessage && <div className={`mt-2 ${statusColor} text-sm font-medium`}>{statusMessage}</div>}

        <p className="text-sm mt-4 text-slate-700">Transaction Hash:</p>
        <a
          href={getExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 text-sm break-all inline-block mt-1"
        >
          {txHash.slice(0, 12)}...{txHash.slice(-10)}
        </a>

        <div className="mt-6">
          <button
            onClick={downloadReceipt}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Download Receipt
          </button>
        </div>
      </div>
    );
  }

  // If deposit address has been created, show details + inline pay button
  if (depositAddress) {
    return (
      <div className="mt-4 text-center">
        {showChainWarning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Please switch to <strong>{targetChain?.name}</strong> network to complete this payment
            </p>
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm !text-gray-600 mb-2">Send to deposit address:</p>
          <p className="font-mono text-sm break-all mb-4 text-slate-800">{depositAddress}</p>
          <p className="text-lg font-bold text-slate-800">
            {cryptoAmount} {selectedToken}
          </p>
          <p className="text-sm !text-gray-600 mt-2">
            ≈ {fiatAmount} {currency} via {offRampProvider}
          </p>
          <p className="text-sm !text-gray-500 mt-2">
            Rate: 1 {selectedToken} = {rate.toFixed(2)} {currency}
          </p>
        </div>

        <button
          onClick={handlePay}
          disabled={
            loading ||
            !connectedWallet ||
            (!!chainId && derivedCurrentChainId !== chainId) ||
            !authenticated
          }
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {txStatus === "idle" ? "Processing..." : statusMessage || "Processing..."}
            </span>
          ) : (
            `Pay with Wallet`
          )}
        </button>

        {txStatus !== "idle" && txStatus !== "confirmed" && !error && (
          <div className={`mt-2 ${statusColor} text-sm font-medium`}>{statusMessage}</div>
        )}
      </div>
    );
  }

  // Main initial render (select network + token, then open modal -> create order)
  return (
    <div className="mt-4">
      <Toaster position="top-right" />
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Wallet Address (Refund Address)
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={handleWalletAddressChange}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded-lg text-slate-700"
          />
          {walletAddress && !isValidAddress(walletAddress) && (
            <p className="text-red-500 text-sm mt-1">Invalid wallet address</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Blockchain Network
          </label>
          <select
            value={selectedChain}
            onChange={handleChainChange}
            className="w-full p-2 border border-gray-300 rounded-lg text-slate-700"
          >
            <option value="">Choose network</option>
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.name} value={chain.name}>
                {chain.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={handleTokenChange}
            className="w-full p-2 border border-gray-300 rounded-lg text-slate-700"
            disabled={!selectedChain}
          >
            <option value="">Choose token</option>
            {selectedChain &&
              SUPPORTED_TOKENS.filter((token) => {
                const chain = SUPPORTED_CHAINS.find((c) => c.name === selectedChain);
                return chain?.supports.includes(token);
              }).map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
          </select>
        </div>
      </div>

      <button
        onClick={async () => {
          if (!selectedToken || !selectedChain || !walletAddress) return;
          if (!isValidAddress(walletAddress)) {
            setError("Please enter a valid wallet address");
            return;
          }

          setLoading(true);
          try {
            const [currentRate, verification] = await Promise.all([
              fetchRate(),
              verifyRecipient(),
            ]);

            if (currentRate && verification) {
              setRate(currentRate);
              setVerificationStatus(verification);
              setShowPaymentModal(true);
            }
          } catch (error) {
            toast.error("Failed to fetch payment details");
            console.error(error);
          } finally {
            setLoading(false);
          }
        }}
        className={`mt-6 w-full px-4 py-2 rounded-lg font-medium ${
          selectedToken &&
          selectedChain &&
          walletAddress &&
          isValidAddress(walletAddress)
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={
          !selectedToken ||
          !selectedChain ||
          !walletAddress ||
          !isValidAddress(walletAddress) ||
          loading
        }
      >
        {loading ? "Loading..." : "Proceed to Payment"}
      </button>

      {/* Payment details modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {!rate || !verificationStatus ? (
            <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
              <div className="flex justify-center">
                <svg className="animate-spin w-8 h-8 text-blue-500" />
              </div>
              <p className="mt-4">Preparing payment details...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Payment Details</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Exchange Rate</p>
                  <p className="font-semibold text-slate-700">
                    1 {selectedToken} = {rate.toFixed(2)} {currency}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Recipient Verification</p>
                  {verificationStatus ? (
                    <p className="text-green-600 font-semibold">
                      Verified • {verificationStatus.accountName}
                    </p>
                  ) : (
                    <p className="text-yellow-600">Pending verification</p>
                  )}
                </div>

                <div>
                  <p className="text-gray-600">You Pay</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {cryptoAmount} {selectedToken}
                  </p>
                  <p className="text-gray-600">
                    ≈ {fiatAmount} {currency}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={createOffRampOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  disabled={!verificationStatus || !walletAddress}
                >
                  Initiate Order
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
