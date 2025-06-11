"use client";
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import { utils } from "ethers";
import { useAccount } from "wagmi";
import {
  ClipboardCopy,
  ExternalLink,
  CheckCircle,
  QrCode,
  Wallet,
  Banknote
} from "lucide-react";

const PaymentQRCode = dynamicImport(() => import("./QRCode"), { ssr: false });
const PayWithWallet = dynamicImport(() => import("./PayWithWallet"), { ssr: false });

export default function PayPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");
  const description = searchParams.get("description");
  const { address: connectedAddress } = useAccount();

  let to = searchParams.get("to");
  if (!to || !utils.isAddress(to)) {
    to = connectedAddress || "";
  }

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
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
        
        {/* Header */}
        <div className="text-center space-y-3">
          {/* <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Banknote size={24} className="text-white" />
          </div> */}
          <h1 className="text-2xl font-bold text-gray-900">Payment Request</h1>
        </div>

        {/* Amount */}
        <div className="text-center bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Amount</p>
          <p className="text-3xl font-bold text-gray-900">
            {amount} <span className="text-xl font-normal">{currency}</span>
          </p>
        </div>

        {/* Description */}
        {description && (
          <div className="text-center bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="text-lg font-medium text-gray-900">
              {decodeURIComponent(description)}
            </p>
          </div>
        )}

        {/* Wallet Address */}
        <div className="w-80 mx-auto space-y-2">
          <div className="flex items-center justify-between gap-4 bg-gray-100 px-4 py-3 rounded-lg group transition-all duration-200 group-hover:border-blue-500 border">
            {/* Column 1: Wallet label */}
            <div className="flex-1 flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Merchant Wallet
              </span>
            </div>

            {/* Column 2: Short address (centered text) */}
            <div className="flex-1 text-center">
              <span className="font-mono text-sm text-gray-800">
                {shortAddress}
              </span>
            </div>

            {/* Column 3: Copy button */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleCopy}
                className="p-2 !bg-blue-500 rounded-lg text-white hover:!bg-blue-600 hover:text-white transition-colors duration-200"
                aria-label="Copy address"
              >
                {copied ? <CheckCircle size={16} /> : <ClipboardCopy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-gray-50 p-2 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-4">
            <QrCode size={18} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">Scan to Pay</h2>
          </div>
          <div className="flex justify-center">
            <PaymentQRCode to={to || ""} amount={amount || ""} currency={currency || ""} description={description || ""} />
          </div>
        </div>

        {/* Pay with Wallet */}
        <PayWithWallet to={to || ""} amount={amount || ""} currency={currency || ""} description={description || ""} />

        {/* Block Explorer Link */}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 bg-amber-50 p-4 rounded-xl">
          <p className="mb-1">
            Send exactly <span className="font-semibold text-blue-600">{amount} {currency}</span> to complete payment.
          </p>
          <p>Transaction confirmation will appear automatically.</p>
        </div>
        
      </div>
    </div>
  );
}