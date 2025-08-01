"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import axios from "axios";
import { stablecoins } from "../../data/stablecoins";
import { Toaster, toast } from "react-hot-toast";
import {
  fetchTokenRate,
  verifyAccount,
  initiatePaymentOrder,
} from "../../utils/paycrest";

// Chain configuration
const SUPPORTED_CHAINS = [
  { name: "base", id: 8453, supports: ["USDC"] },
  { name: "arbitrum-one", id: 42161, supports: ["USDC", "USDT"] },
  { name: "polygon", id: 137, supports: ["USDC", "USDT"] },
  { name: "celo", id: 42220, supports: ["USDC", "USDT"] },
  { name: "bnb", id: 56, supports: ["USDC", "USDT"] },
];

// Token configuration
const SUPPORTED_TOKENS = ["USDC", "USDT"];
const TOKEN_ADDRESSES = {
  USDC: {
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
    42220: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // Celo
    56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BNB Chain
  },
  USDT: {
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum
    137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon
    42220: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // Celo
    56: "0x55d398326f99059fF775485246999027B3197955", //binance
  },
};

const TOKEN_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
];

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
  chainId?: number;
}) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositAddress, setDepositAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [fiatAmount] = useState(amount);
  const [rate, setRate] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("");
  const { address } = useAccount();

  // Handle chain selection change
  const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chain = e.target.value;
    setSelectedChain(chain);

    // Reset token if not supported by new chain
    if (selectedToken) {
      const chainSupports =
        SUPPORTED_CHAINS.find((c) => c.name === chain)?.supports || [];
      if (!chainSupports.includes(selectedToken)) {
        setSelectedToken("");
      }
    }
  };

  // Handle token selection change
  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(e.target.value);
  };

  // Get token amount based on fiat amount and rate
  const calculateTokenAmount = async () => {
    if (!rate || !selectedToken) return;

    try {
      const tokenAmount = parseFloat(fiatAmount) / rate;
      setCryptoAmount(tokenAmount.toFixed(6));
      return tokenAmount;
    } catch (error) {
      console.error("Amount calculation error:", error);
      setError("Failed to calculate token amount");
    }
  };

  // Verify recipient account
  const verifyRecipient = async () => {
    try {
      const verification = await verifyAccount(offRampProvider, offRampValue);
      setVerificationStatus(verification);
      return verification;
    } catch (error) {
      console.error("Verification error:", error);
      setError("Account verification failed");
      return null;
    }
  };

  // Format chain name for API
  const formatChainName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").trim();
  };

  // Fetch current exchange rate
  const fetchRate = async () => {
    try {
      const rate = await fetchTokenRate(
        selectedToken,
        parseFloat(fiatAmount),
        currency,
        selectedChain
      );
      setRate(parseFloat(rate));
      return rate;
    } catch (error) {
      console.error("Rate fetch error:", error);
      setError("Failed to fetch exchange rate");
      return null;
    }
  };

  // Initiate payment order
  const createOffRampOrder = async () => {
    try {
      setLoading(true);

      const tokenAmount = await calculateTokenAmount();
      if (!tokenAmount) return;

      const order = await initiatePaymentOrder({
        amount: tokenAmount,
        rate,
        token: selectedToken,
        network: selectedChain,
        recipient: {
          institution: offRampProvider,
          accountIdentifier: offRampValue,
          accountName: accountName,
          memo: description || "",
        },
        reference: linkId,
        returnAddress: address || to,
      });

      setDepositAddress(order.data.receiveAddress);
      return order;
    } catch (error: any) {
      console.error("Order creation error:", error);
      setError(error.message || "Failed to create order");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Execute token transfer
  const executeNormalTransaction = async () => {
    if (!depositAddress || !cryptoAmount || !selectedToken || !selectedChain)
      return;

    try {
      setLoading(true);

      // Find chain ID
      const chain = SUPPORTED_CHAINS.find((c) => c.name === selectedChain);
      if (!chain) throw new Error("Unsupported chain");

      // Define proper types
      type TokenAddresses = {
        [key: string]: {
          [key: number]: string
        }
      };

      // Get token address with proper type safety
      const tokenAddress =
        (TOKEN_ADDRESSES as TokenAddresses)[selectedToken]?.[chain.id];
      if (!tokenAddress)
        throw new Error("Token not supported on selected chain");

      // Convert amount to wei
      const decimals = 6; // USDC/USDT decimals
      const amountInWei = ethers.utils.parseUnits(cryptoAmount, decimals);

      // Execute transfer
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);

      const txResponse = await contract.transfer(depositAddress, amountInWei);
      setTxHash(txResponse.hash);

      // Wait for confirmation
      await txResponse.wait();
      return txResponse;
    } catch (error: any) {
      console.error("Transaction error:", error);
      setError(error.message || "Transaction failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle payment initiation
  const handleInitiatePayment = async () => {
    try {
      setLoading(true);

      // Verify account and fetch rate in parallel
      const [verification, currentRate] = await Promise.all([
        verifyRecipient(),
        fetchRate(),
      ]);

      if (!verification || !currentRate) {
        throw new Error("Payment prerequisites not met");
      }

      // Proceed to create order
      await createOffRampOrder();
    } catch (error) {
      console.error("Payment initiation error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Download transaction receipt
  const downloadReceipt = () => {
    const receipt = `
      OFF-RAMP PAYMENT RECEIPT
      -------------------------
      Transaction Hash: ${txHash}
      Date: ${new Date().toLocaleString()}
      From: ${address}
      To: ${depositAddress}
      Amount: ${cryptoAmount} ${selectedToken}
      Fiat Equivalent: ${fiatAmount} ${currency}
      Exchange Rate: 1 ${selectedToken} = ${rate} ${currency}
      Recipient: ${accountName} (${offRampValue})
      Provider: ${offRampProvider}
      Description: ${description || "N/A"}
      Network: ${selectedChain}
      
      IMPORTANT: If off-ramp processing fails, tokens will be refunded
      to the originating wallet within 7 business days.
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

  // Render loading state
  if (loading) {
    return (
      <div className="mt-4 text-center">
        <div className="flex justify-center">
          <svg
            className="animate-spin w-8 h-8 text-blue-500"
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
        </div>
        <p className="mt-2 text-blue-600">Processing transaction...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
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

  // Render transaction success
  if (txHash) {
    return (
      <div className="mt-4 text-center p-6 bg-green-50 rounded-xl">
        <svg
          className="w-16 h-16 text-green-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <h3 className="text-xl font-bold mt-4">Payment Successful!</h3>
        <p className="mt-2">
          {cryptoAmount} {selectedToken} sent
        </p>
        <p className="text-sm mt-4">Transaction Hash:</p>
        <a
          href={`https://explorer.chain/${txHash}`}
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

  // Render payment modal
  if (showPaymentModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Payment Details</h3>

          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Exchange Rate</p>
              <p className="font-semibold">
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
              <p className="text-2xl font-bold">
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
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={createOffRampOrder}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              disabled={!verificationStatus}
            >
              Initiate Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render deposit address
  if (depositAddress) {
    return (
      <div className="mt-4 text-center">
        <div className="mb-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-2">Send to deposit address:</p>
          <p className="font-mono text-sm break-all mb-4">{depositAddress}</p>
          <p className="text-lg font-bold">
            {cryptoAmount} {selectedToken}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ≈ {fiatAmount} {currency} via {offRampProvider}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Rate: 1 {selectedToken} = {rate.toFixed(2)} {currency}
          </p>
        </div>

        <button
          onClick={executeNormalTransaction}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Send Tokens
        </button>

        <p className="text-sm text-gray-600 mt-4">
          Funds will be converted and sent to {offRampValue} after confirmation
        </p>
      </div>
    );
  }

  // Main render (token/chain selection)
  return (
    <div className="mt-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Blockchain Network
          </label>
          <select
            value={selectedChain}
            onChange={handleChainChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
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
            className="w-full p-2 border border-gray-300 rounded-lg"
            disabled={!selectedChain}
          >
            <option value="">Choose token</option>
            {selectedChain &&
              SUPPORTED_TOKENS.filter((token) => {
                const chain = SUPPORTED_CHAINS.find(
                  (c) => c.name === selectedChain
                );
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
        onClick={() => setShowPaymentModal(true)}
        className={`mt-6 w-full px-4 py-2 rounded-lg font-medium ${
          selectedToken && selectedChain
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!selectedToken || !selectedChain}
      >
        Proceed to Payment
      </button>
    </div>
  );
}
