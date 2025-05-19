"use client";
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import { useAccount } from "wagmi";
import { utils } from "ethers";
import {
  ClipboardCopy,
  ExternalLink,
  CheckCircle,
  Send,
  QrCode,
  Wallet,
  Coins,
  Repeat,
  CoinsIcon,
  Banknote
} from "lucide-react";
import Link from "next/link";

const PaymentQRCode = dynamicImport(() => import("./QRCode"), { ssr: false });
const PayWithWallet = dynamicImport(() => import("./PayWithWallet"), { ssr: false });

export default function PayPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");
  const { address: connectedAddress } = useAccount();

  let to = searchParams.get("to");
  if (!to || !utils.isAddress(to)) {
    to = connectedAddress || "";
  }

  // Shorten wallet address to first 6 and last 4 characters
  const shortAddress = to ? `${to.slice(0, 6)}...${to.slice(-4)}` : "";

  useEffect(() => {
    setCopied(false);
  }, [to]);

  const handleCopy = () => {
    if (to) {
      navigator.clipboard.writeText(to);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 pb-24 font-sans">      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-6 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="bg-blue-500 text-white p-3 rounded-full shadow-lg transform transition-transform hover:scale-105">
            <Banknote size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Pay Merchant
          </h1>
        </div>

        {/* Amount */}
        <div className="text-center bg-gray-100 dark:bg-gray-700/50 p-4 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Amount</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {amount} <span className="text-lg">{currency}</span>
          </p>
        </div>

        {/* Wallet Address */}
        <div className="w-80 mx-auto space-y-2">
  <div className="flex items-center justify-between gap-4 bg-gray-100 dark:bg-gray-700/50 px-4 py-3 rounded-lg group transition-all duration-200 group-hover:border-blue-500 border">
    
    {/* Column 1: Wallet label */}
    <div className="flex-1 flex items-center gap-2">
      <Wallet size={18} className="text-blue-500" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Merchant Wallet
      </span>
    </div>

    {/* Column 2: Short address (centered text) */}
    <div className="flex-1 text-center">
      <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
        {shortAddress}
      </span>
    </div>

    {/* Column 3: Copy button */}
    <div className="flex-1 flex justify-end">
      <button
        onClick={handleCopy}
        className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white transition-colors duration-200"
        aria-label="Copy address"
      >
        {copied ? <CheckCircle size={16} /> : <ClipboardCopy size={16} />}
      </button>
    </div>
  </div>
</div>


        {/* QR Code */}
        <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-center gap-2">
            <QrCode size={18} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Scan to Pay
            </h2>
          </div>
          <div className="flex justify-center">
            <PaymentQRCode to={to || ""} amount={amount || ""} currency={currency || ""} />
          </div>
        </div>

        {/* Pay with Wallet */}
        <div>
          <PayWithWallet to={to || ""} amount={amount || ""} currency={currency || ""} />
        </div>

        {/* View on Block Explorer */}
        <div className="text-center">
          <a
            href={`https://basescan.org/address/${to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ExternalLink size={16} className="mr-2" />
            View on BaseScan
          </a>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            Send exactly{" "}
            <span className="font-semibold text-blue-500">
              {amount} {currency}
            </span>{" "}
            to the merchant wallet.
          </p>
          <p>The merchant will confirm your transaction after payment.</p>
        </div>
        
      </div>


      {/* Inline Styles for Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}