// "use client";

// import { useState, useEffect } from "react";
// import { ethers } from "ethers";
// import axios from "axios";
// import { Toaster, toast } from "react-hot-toast";
// import WalletConnectButton from "./WalletConnectButton";
// import {
//   fetchTokenRate,
//   verifyAccount,
//   initiatePaymentOrder,
// } from "../../utils/paycrest";

// // Chain configuration
// const SUPPORTED_CHAINS = [
//   { name: "base", id: 8453, supports: ["USDC"], rpcUrls: ["https://mainnet.base.org"] },
//   { name: "arbitrum-one", id: 42161, supports: ["USDC", "USDT"], rpcUrls: ["https://arb1.arbitrum.io/rpc"] },
//   { name: "polygon", id: 137, supports: ["USDC", "USDT"], rpcUrls: ["https://polygon-rpc.com"] },
//   { name: "celo", id: 42220, supports: ["USDC", "USDT"], rpcUrls: ["https://forno.celo.org"] },
//   { name: "bnb", id: 56, supports: ["USDC", "USDT"], rpcUrls: ["https://bsc-dataseed.binance.org"] },
// ];

// // Token configuration
// const SUPPORTED_TOKENS = ["USDC", "USDT"];
// const TOKEN_ADDRESSES = {
//   USDC: {
//     8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
//     42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
//     137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
//     42220: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // Celo
//     56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BNB Chain
//   },
//   USDT: {
//     42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum
//     137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon
//     42220: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // Celo
//     56: "0x55d398326f99059fF775485246999027B3197955", //binance
//   },
// };

// export default function OffRampPayment({
//   to,
//   amount,
//   currency,
//   description,
//   offRampType,
//   offRampValue,
//   accountName,
//   offRampProvider,
//   linkId,
//   chainId,
// }: {
//   to: string;
//   amount: string;
//   currency: string;
//   description?: string;
//   offRampType: "PHONE" | "BANK_ACCOUNT";
//   offRampValue: string;
//   accountName: string;
//   offRampProvider: string;
//   linkId: string;
//   chainId?: number;
// }) {
//   const [txHash, setTxHash] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [depositAddress, setDepositAddress] = useState("");
//   const [cryptoAmount, setCryptoAmount] = useState("");
//   const [fiatAmount] = useState(amount);
//   const [rate, setRate] = useState(0);
//   const [verificationStatus, setVerificationStatus] = useState<any>(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [selectedToken, setSelectedToken] = useState<string>("");
//   const [selectedChain, setSelectedChain] = useState<string>("");
//   const [walletAddress, setWalletAddress] = useState("");

//   // Handle chain selection change
//   const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const chain = e.target.value;
//     setSelectedChain(chain);

//     // Reset token if not supported by new chain
//     if (selectedToken) {
//       const chainSupports =
//         SUPPORTED_CHAINS.find((c) => c.name === chain)?.supports || [];
//       if (!chainSupports.includes(selectedToken)) {
//         setSelectedToken("");
//       }
//     }
//   };

//   // Handle token selection change
//   const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedToken(e.target.value);
//   };

//   // Handle wallet address change
//   const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setWalletAddress(e.target.value);
//   };

//   // Validate Ethereum address
//   const isValidAddress = (address: string) => {
//     return ethers.utils.isAddress(address);
//   };

//   // Calculate token amount based on fiat amount and rate
//   const calculateTokenAmount = () => {
//     if (!rate || !fiatAmount) return "0";
    
//     try {
//       const tokenAmount = parseFloat(fiatAmount) / rate;
//       const formattedAmount = tokenAmount.toFixed(6);
//       setCryptoAmount(formattedAmount);
//       return formattedAmount;
//     } catch (error) {
//       console.error("Amount calculation error:", error);
//       setError("Failed to calculate token amount");
//       return "0";
//     }
//   };

//   // Recalculate when rate changes
//   useEffect(() => {
//     if (rate > 0) {
//       calculateTokenAmount();
//     }
//   }, [rate]);

//   // Verify recipient account
//   const verifyRecipient = async () => {
//     try {
//       const verification = await verifyAccount(offRampProvider, offRampValue);
//       setVerificationStatus(verification);
//       return verification;
//     } catch (error) {
//       console.error("Verification error:", error);
//       setError("Account verification failed");
//       return null;
//     }
//   };

//   // Fetch current exchange rate
//   const fetchRate = async () => {
//     try {
//       const rateValue = await fetchTokenRate(
//         selectedToken,
//         1,
//         currency,
//         selectedChain
//       );
//       const rateNum = parseFloat(rateValue);
//       setRate(rateNum);
//       return rateNum;
//     } catch (error) {
//       console.error("Rate fetch error:", error);
//       setError("Failed to fetch exchange rate");
//       return 0;
//     }
//   };

//   // Initiate payment order
//   const createOffRampOrder = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       if (!isValidAddress(walletAddress)) {
//         throw new Error("Please enter a valid wallet address");
//       }

//       const tokenAmount = calculateTokenAmount();
//       if (!tokenAmount || tokenAmount === "0") {
//         throw new Error("Invalid token amount");
//       }

//       const order = await axios.post("/api/paycrest/orders", {
//         amount: tokenAmount,
//         rate,
//         token: selectedToken,
//         network: selectedChain,
//         recipient: {
//           institution: offRampProvider,
//           accountIdentifier: offRampValue,
//           accountName: accountName,
//           memo: description || "",
//         },
//         reference: `order-${Date.now()}`,
//         returnAddress: walletAddress,
//       });

//       const {
//         receiveAddress,
//         amount: orderAmount,
//         reference,
//         senderFee,
//         transactionFee,
//         validUntil,
//       } = order.data.data;

//       console.log("order", receiveAddress)
//       setDepositAddress(receiveAddress);
//       console.log("deposit address", receiveAddress)
//       setShowPaymentModal(false);
//       toast.success("Deposit address generated!");
//       return order;
//     } catch (error: any) {
//       console.error("Order creation error:", error);
//       setError(error.message || "Failed to create order");
//       toast.error(error.message || "Order creation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get explorer URL for transaction
//   const getExplorerUrl = () => {
//     const chain = SUPPORTED_CHAINS.find(c => c.name === selectedChain);
//     if (!chain) return "#";
    
//     const explorers: Record<number, string> = {
//       8453: "https://basescan.org/tx/",
//       42161: "https://arbiscan.io/tx/",
//       137: "https://polygonscan.com/tx/",
//       42220: "https://celoscan.io/tx/",
//       56: "https://bscscan.com/tx/"
//     };
    
//     return explorers[chain.id] ? `${explorers[chain.id]}${txHash}` : "#";
//   };

//   // Download transaction receipt
//   const downloadReceipt = () => {
//     const receipt = `
//       OFF-RAMP PAYMENT RECEIPT
//       -------------------------
//       Transaction Hash: ${txHash}
//       Date: ${new Date().toLocaleString()}
//       From: ${walletAddress}
//       To: ${depositAddress}
//       Amount: ${cryptoAmount} ${selectedToken}
//       Fiat Equivalent: ${fiatAmount} ${currency}
//       Exchange Rate: 1 ${selectedToken} = ${rate.toFixed(2)} ${currency}
//       Recipient: ${accountName} (${offRampValue})
//       Provider: ${offRampProvider}
//       Description: ${description || "N/A"}
//       Network: ${selectedChain}
      
//       IMPORTANT: If off-ramp processing fails, tokens will be refunded
//       to the originating wallet within 7 business days.
//     `;

//     const blob = new Blob([receipt], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `offramp-receipt-${txHash?.slice(0, 8)}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   // Handle successful token transfer
//   const handleTransferSuccess = (txHash: string) => {
//     setTxHash(txHash);
//     toast.success("Tokens transferred to deposit address!");
//   };

//   // Render loading state
//   if (loading) {
//     return (
//       <div className="mt-4 text-center">
//         <div className="flex justify-center">
//           <svg
//             className="animate-spin w-8 h-8 text-blue-500"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             ></circle>
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//             ></path>
//           </svg>
//         </div>
//         <p className="mt-2 text-blue-600">Processing transaction...</p>
//       </div>
//     );
//   }

//   // Render error state
//   if (error) {
//     return (
//       <div className="mt-4 text-center">
//         <p className="text-red-600">{error}</p>
//         <button
//           onClick={() => setError(null)}
//           className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   // Render transaction success
//   if (txHash) {
//     return (
//       <div className="mt-4 text-center p-6 bg-green-50 rounded-xl">
//         <svg
//           className="w-16 h-16 text-green-500 mx-auto"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="2"
//             d="M5 13l4 4L19 7"
//           ></path>
//         </svg>
//         <h3 className="text-xl font-bold mt-4">Payment Successful!</h3>
//         <p className="mt-2">
//           {cryptoAmount} {selectedToken} sent
//         </p>
//         <p className="text-sm mt-4">Transaction Hash:</p>
//         <a
//           href={getExplorerUrl()}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-blue-500 text-sm break-all inline-block mt-1"
//         >
//           {txHash.slice(0, 12)}...{txHash.slice(-10)}
//         </a>

//         <div className="mt-6">
//           <button
//             onClick={downloadReceipt}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
//           >
//             Download Receipt
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Render payment modal
//   if (showPaymentModal) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//         {!rate || !verificationStatus ? (
//           <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
//             <div className="flex justify-center">
//               <svg className="animate-spin w-8 h-8 text-blue-500" />
//             </div>
//             <p className="mt-4">Preparing payment details...</p>
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Payment Details</h3>

//             <div className="space-y-4">
//               <div>
//                 <p className="text-gray-600">Exchange Rate</p>
//                 <p className="font-semibold text-slate-700">
//                   1 {selectedToken} = {rate.toFixed(2)} {currency}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-gray-600">Recipient Verification</p>
//                 {verificationStatus ? (
//                   <p className="text-green-600 font-semibold">
//                     Verified • {verificationStatus.accountName}
//                   </p>
//                 ) : (
//                   <p className="text-yellow-600">Pending verification</p>
//                 )}
//               </div>

//               <div>
//                 <p className="text-gray-600">You Pay</p>
//                 <p className="text-2xl font-bold text-slate-700">
//                   {cryptoAmount} {selectedToken}
//                 </p>
//                 <p className="text-gray-600">
//                   ≈ {fiatAmount} {currency}
//                 </p>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-between">
//               <button
//                 onClick={() => setShowPaymentModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg text-slate-700"
//               >
//                 Back
//               </button>
//               <button
//                 onClick={createOffRampOrder}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
//                 disabled={!verificationStatus || !walletAddress}
//               >
//                 Initiate Order
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }

//   console.log("deposit address", depositAddress)
//   // Render deposit address with WalletConnectButton
//   if (depositAddress) {
//     const chain = SUPPORTED_CHAINS.find(c => c.name === selectedChain);
//     const chainId = chain?.id || 8453;
    
//     // Get token address for the selected chain
//     const tokenAddress = (TOKEN_ADDRESSES as any)[selectedToken]?.[chainId];
    
//     return (
//       <div className="mt-4 text-center">
//         <div className="mb-4 p-4 bg-blue-50 rounded-xl">
//           <p className="text-sm text-gray-600 mb-2">Send to deposit address:</p>
//           <p className="font-mono text-sm break-all mb-4">{depositAddress}</p>
//           <p className="text-lg font-bold">
//             {cryptoAmount} {selectedToken}
//           </p>
//           <p className="text-sm text-gray-600 mt-2">
//             ≈ {fiatAmount} {currency} via {offRampProvider}
//           </p>
//           <p className="text-sm text-gray-500 mt-2">
//             Rate: 1 {selectedToken} = {rate.toFixed(2)} {currency}
//           </p>
//         </div>

//         <div className="mt-6">
//           <WalletConnectButton
//             to={depositAddress}
//             amount={cryptoAmount}
//             currency={selectedToken}
//             description={description}
//             chainId={chainId}
//           />
//         </div>

//         <p className="text-sm text-gray-600 mt-4">
//           Funds will be converted and sent to {offRampValue} after confirmation
//         </p>
//       </div>
//     );
//   }

//   // Main render (token/chain selection)
//   return (
//     <div className="mt-4">
//       <Toaster position="top-right" />
//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Your Wallet Address (Refund Address)
//           </label>
//           <input
//             type="text"
//             value={walletAddress}
//             onChange={handleWalletAddressChange}
//             placeholder="0x..."
//             className="w-full p-2 border border-gray-300 rounded-lg text-slate-700"
//           />
//           {walletAddress && !isValidAddress(walletAddress) && (
//             <p className="text-red-500 text-sm mt-1">Invalid wallet address</p>
//           )}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Select Blockchain Network
//           </label>
//           <select
//             value={selectedChain}
//             onChange={handleChainChange}
//             className="w-full p-2 border border-gray-300 rounded-lg text-slate-700"
//           >
//             <option value="">Choose network</option>
//             {SUPPORTED_CHAINS.map((chain) => (
//               <option key={chain.name} value={chain.name}>
//                 {chain.name.toUpperCase()}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Select Token
//           </label>
//           <select
//             value={selectedToken}
//             onChange={handleTokenChange}
//             className="w-full p-2 border border-gray-300 rounded-lg text-slate-700"
//             disabled={!selectedChain}
//           >
//             <option value="">Choose token</option>
//             {selectedChain &&
//               SUPPORTED_TOKENS.filter((token) => {
//                 const chain = SUPPORTED_CHAINS.find(
//                   (c) => c.name === selectedChain
//                 );
//                 return chain?.supports.includes(token);
//               }).map((token) => (
//                 <option key={token} value={token}>
//                   {token}
//                 </option>
//               ))}
//           </select>
//         </div>
//       </div>

//       <button
//         onClick={async () => {
//           if (!selectedToken || !selectedChain || !walletAddress) return;
//           if (!isValidAddress(walletAddress)) {
//             setError("Please enter a valid wallet address");
//             return;
//           }
          
//           setLoading(true);
//           try {
//             const [currentRate, verification] = await Promise.all([
//               fetchRate(),
//               verifyRecipient()
//             ]);
            
//             if (currentRate && verification) {
//               setRate(currentRate);
//               setVerificationStatus(verification);
//               setShowPaymentModal(true);
//             }
//           } catch (error) {
//             toast.error("Failed to fetch payment details");
//             console.error(error);
//           } finally {
//             setLoading(false);
//           }
//         }}
//         className={`mt-6 w-full px-4 py-2 rounded-lg font-medium ${
//           selectedToken && selectedChain && walletAddress && isValidAddress(walletAddress)
//             ? "bg-blue-600 text-white hover:bg-blue-700"
//             : "bg-gray-300 text-gray-500 cursor-not-allowed"
//         }`}
//         disabled={!selectedToken || !selectedChain || !walletAddress || !isValidAddress(walletAddress) || loading}
//       >
//         {loading ? "Loading..." : "Proceed to Payment"}
//       </button>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
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
  "function balanceOf(address owner) view returns (uint256)",
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
  const [walletAddress, setWalletAddress] = useState("");

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

  // Handle wallet address change
  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
  };

  // Validate Ethereum address
  const isValidAddress = (address: string) => {
    return ethers.utils.isAddress(address);
  };

  // Calculate token amount based on fiat amount and rate
  const calculateTokenAmount = () => {
    if (!rate || !fiatAmount) return "0";
    
    try {
      const tokenAmount = parseFloat(fiatAmount) / rate;
      const formattedAmount = tokenAmount.toFixed(6);
      setCryptoAmount(formattedAmount);
      return formattedAmount;
    } catch (error) {
      console.error("Amount calculation error:", error);
      setError("Failed to calculate token amount");
      return "0";
    }
  };

  // Recalculate when rate changes
  useEffect(() => {
    if (rate > 0) {
      calculateTokenAmount();
    }
  }, [rate]);

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

  // Fetch current exchange rate
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
    } catch (error) {
      console.error("Rate fetch error:", error);
      setError("Failed to fetch exchange rate");
      return 0;
    }
  };

  // Initiate payment order
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
          accountName: accountName,
          memo: description || "",
        },
        reference: `order-${Date.now()}`,
        returnAddress: walletAddress,
      });
      const {
                receiveAddress,
                amount: orderAmount,
                reference,
                senderFee,
                transactionFee,
                validUntil,
              } = order.data.data;
        
              console.log("order", receiveAddress)
              setDepositAddress(receiveAddress);
              console.log("deposit address", receiveAddress)
      setShowPaymentModal(false);
      toast.success("Deposit address generated!");
      return order;
    } catch (error: any) {
      console.error("Order creation error:", error);
      setError(error.message || "Failed to create order");
      toast.error(error.message || "Order creation failed");
    } finally {
      setLoading(false);
    }
  };

  // Execute token transfer
  const executeNormalTransaction = async () => {
    if (!depositAddress || !cryptoAmount || !selectedToken || !selectedChain) {
      toast.error("Missing required payment details");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if wallet is available
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask!");
      }

      // Request account access
      await (window.ethereum as any).request({ method: "eth_requestAccounts" });

      // Find chain configuration
      const chain = SUPPORTED_CHAINS.find((c) => c.name === selectedChain);
      if (!chain) throw new Error("Unsupported chain");

      // Get token address
      const tokenAddress = (TOKEN_ADDRESSES as any)[selectedToken]?.[chain.id];
      if (!tokenAddress) {
        throw new Error("Token not supported on selected chain");
      }

      // Convert amount to wei
      const decimals = 6; // USDC/USDT decimals
      const amountInWei = ethers.utils.parseUnits(cryptoAmount, decimals);

      // Get provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Check balance
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
      const balance = await tokenContract.balanceOf(await signer.getAddress());
      
      if (balance.lt(amountInWei)) {
        throw new Error("Insufficient token balance");
      }

      // Execute transfer
      const txResponse = await tokenContract.transfer(depositAddress, amountInWei);
      setTxHash(txResponse.hash);
      toast.success("Transaction submitted!");

      // Wait for confirmation
      await txResponse.wait();
      toast.success("Transaction confirmed!");
      return txResponse;
    } catch (error: any) {
      console.error("Transaction error:", error);
      setError(error.message || "Transaction failed");
      toast.error(error.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // Get explorer URL for transaction
  const getExplorerUrl = () => {
    const chain = SUPPORTED_CHAINS.find(c => c.name === selectedChain);
    if (!chain) return "#";
    
    const explorers: Record<number, string> = {
      8453: "https://basescan.org/tx/",
      42161: "https://arbiscan.io/tx/",
      137: "https://polygonscan.com/tx/",
      42220: "https://celoscan.io/tx/",
      56: "https://bscscan.com/tx/"
    };
    
    return explorers[chain.id] ? `${explorers[chain.id]}${txHash}` : "#";
  };

  // Download transaction receipt
  const downloadReceipt = () => {
    const receipt = `
      OFF-RAMP PAYMENT RECEIPT
      -------------------------
      Transaction Hash: ${txHash}
      Date: ${new Date().toLocaleString()}
      From: ${walletAddress}
      To: ${depositAddress}
      Amount: ${cryptoAmount} ${selectedToken}
      Fiat Equivalent: ${fiatAmount} ${currency}
      Exchange Rate: 1 ${selectedToken} = ${rate.toFixed(2)} ${currency}
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
        <h3 className="text-xl font-bold mt-4 text-slate-700">Payment Successful!</h3>
        <p className="mt-2">
          {cryptoAmount} {selectedToken} sent
        </p>
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

  // Render payment modal
  if (showPaymentModal) {
    return (
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
    );
  }

  // Render deposit address
  if (depositAddress) {
    return (
      <div className="mt-4 text-center">
        <div className="mb-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm !text-gray-600 mb-2">Send to deposit address:</p>
          <p className="font-mono text-sm break-all mb-4">{depositAddress}</p>
          <p className="text-lg font-bold">
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
          onClick={executeNormalTransaction}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Send Tokens
        </button>

        <p className="text-sm !text-gray-600 mt-4">
          Funds will be converted and sent to {offRampValue} after confirmation
        </p>
      </div>
    );
  }

  // Main render (token/chain selection)
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
              verifyRecipient()
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
          selectedToken && selectedChain && walletAddress && isValidAddress(walletAddress)
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!selectedToken || !selectedChain || !walletAddress || !isValidAddress(walletAddress) || loading}
      >
        {loading ? "Loading..." : "Proceed to Payment"}
      </button>
    </div>
  );
}