"use client";
export const dynamic = "force-dynamic";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import { utils } from "ethers";
import { useAccount } from "wagmi";
import {
  ChevronDown,
  ClipboardCopy,
  CheckCircle,
  QrCode,
  Wallet,
  Download,
  LogIn,
  Shield,
  Lock,
  Zap,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { SUPPORTED_CHAINS, SUPPORTED_CHAINS_NORMAL } from "@/ramps/payramp/offrampHooks/constants";
import { stablecoins } from "@/data/stablecoins";
import {
  mainnet,
  base,
  polygon,
  arbitrum,
  celo,
  scroll,
  bsc,
} from "viem/chains";
import Header from "@/components/Header";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// const PaymentQRCode = dynamicImport(() => import("./QRCode"), { ssr: false });
const PayWithWallet = dynamicImport(() => import("./PayWithWallet"), {
  ssr: false,
});
const OffRampPayment = dynamicImport(() => import("./OfframpPayment"), {
  ssr: false,
});

// Supported chains for normal payments
const NORMAL_PAYMENT_CHAINS = [
  mainnet,
  base,
  polygon,
  arbitrum,
  celo,
  scroll,
  bsc,
];

export default function PayPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { authenticated, login, ready } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [currentStep, setCurrentStep] = useState<"details" | "payment">("details");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  
  const amountParam = searchParams.get("amount");
  const amount = amountParam === "0" ? null : amountParam;
  const currency = searchParams.get("currency");
  const description = searchParams.get("description");
  const to = searchParams.get("to");
  const signature = searchParams.get("sig");
  const offRampType = searchParams.get("offRampType");
  const offRampValue = searchParams.get("offRampValue");
  const offRampProvider = searchParams.get("offRampProvider");
  const accountName = searchParams.get("accountName");

  const chainIdParam = searchParams.get("chainId");
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;
  const tokenParam = searchParams.get("token");

  const [selectedChain, setSelectedChain] = useState(
    chainId?.toString() || "8453"
  );
  const [selectedToken, setSelectedToken] = useState(
    tokenParam || currency || "USDC"
  );

  // Determine link type
  const linkType = offRampType ? "offramp" : "normal";

  // Find the resolved chain
  const resolvedChain = NORMAL_PAYMENT_CHAINS.find(
    (chain) => chain.id === parseInt(selectedChain)
  );

  // Generate QR code data
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const currentUrl = window.location.href;
        const qrData = await QRCode.toDataURL(currentUrl, {
          width: 200,
          margin: 2,
        });
        setQrDataUrl(qrData);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    generateQRCode();
  }, []);

  // Validate link on mount
  useEffect(() => {
    const validateLink = () => {
      if (!signature) {
        setIsValidLink(false);
        setErrorMessage("Invalid payment link - missing signature");
        return;
      }

      if (linkType === "offramp" && (!offRampType || !offRampValue)) {
        setIsValidLink(false);
        setErrorMessage("Invalid offramp link - missing required parameters");
        return;
      }

      if (linkType === "normal" && !to) {
        setIsValidLink(false);
        setErrorMessage("Invalid payment link - missing recipient address");
        return;
      }

      setIsValidLink(true);
      setIsLoading(false);
    };

    validateLink();
  }, [signature, linkType, offRampType, offRampValue, to]);

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Details View Component
  const DetailsView = ({
    amount,
    currency,
    selectedToken,
    description,
    resolvedChain,
    linkType,
    qrDataUrl,
    onProceedToPay
  }: {
    amount: string | null;
    currency: string | null;
    selectedToken: string;
    description: string | null;
    resolvedChain: any;
    linkType: string;
    qrDataUrl: string | null;
    onProceedToPay: () => void;
  }) => {
    return (
      <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden !rounded-2xl">
        <CardContent className="p-4 space-y-4">
          {/* Amount Display */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10 !rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-xs font-medium">Amount</span>
              {resolvedChain && (
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs flex items-center space-x-1">
                  <Image 
                    src={SUPPORTED_CHAINS_NORMAL.find(c => c.id === resolvedChain.id)?.icon || '/base.svg'} 
                    alt={resolvedChain.name} 
                    width={12} 
                    height={12} 
                    className="rounded-full"
                  />
                  <span>{resolvedChain.name}</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {selectedToken && !currency && (
                <Image
                  src={stablecoins.find(t => t.baseToken.toLowerCase() === selectedToken?.toLowerCase())?.flag || ""}
                  alt={selectedToken}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <div>
                <div className="text-lg font-semibold text-white">
                  {amount ? `${amount}` : "Any Amount"}
                </div>
                {(currency || selectedToken) && (
                  <div className="text-slate-400 text-xs">
                    {currency || selectedToken}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          {description && (
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10 !rounded-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white text-xs font-medium">Description</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
            </div>
          )}

          {/* Security Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/30 rounded-lg p-2 border border-white/10 text-center">
              <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-slate-300">SSL Secured</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2 border border-white/10 text-center">
              <CheckCircle className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-xs text-slate-300">Blockchain Verified</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2 border border-white/10 text-center">
              <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-xs text-slate-300">Instant</div>
            </div>
          </div>

          {/* QR Code Section with Proceed Button */}
          {qrDataUrl && (
            <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10 !rounded-2xl text-center relative">
              <div className="mb-3">
                <span className="text-white text-xs font-medium">Scan to Pay</span>
              </div>
              <div className="relative inline-block">
                <Image
                  src={qrDataUrl}
                  alt="Payment QR Code"
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg bg-white p-2"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    onClick={onProceedToPay}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg backdrop-blur-sm bg-opacity-90 hover:bg-opacity-100 transition-all duration-200"
                  >
                    Proceed to Pay
                  </Button>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Or click "Proceed to Pay" to use wallet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Payment View Component  
  const PaymentView = ({
    amount,
    currency,
    selectedToken,
    description,
    resolvedChain,
    linkType,
    chainId,
    to,
    params,
    customAmount,
    setCustomAmount,
    showAmountInput,
    setShowAmountInput,
    selectedChain,
    setSelectedChain,
    setSelectedToken,
    offRampType,
    offRampValue,
    offRampProvider,
    accountName,
    onBackToDetails
  }: {
    amount: string | null;
    currency: string | null;
    selectedToken: string;
    description: string | null;
    resolvedChain: any;
    linkType: string;
    chainId: number | null;
    to: string | null;
    params: { id: string };
    customAmount: string;
    setCustomAmount: (value: string) => void;
    showAmountInput: boolean;
    setShowAmountInput: (value: boolean) => void;
    selectedChain: string;
    setSelectedChain: (value: string) => void;
    setSelectedToken: (value: string) => void;
    offRampType: string | null;
    offRampValue: string | null;
    offRampProvider: string | null;
    accountName: string | null;
    onBackToDetails: () => void;
  }) => {
    return (
      <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden !rounded-2xl">
        <CardContent className="p-4 space-y-4">
          {/* Back Button */}
          <div className="flex items-center space-x-2 mb-4">
            <Button
              onClick={onBackToDetails}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Details
            </Button>
          </div>

          {/* Payment Content */}
          {linkType === "offramp" ? (
            <OffRampPayment
              amount={amount}
              currency={currency}
              selectedToken={selectedToken}
              description={description}
              resolvedChain={resolvedChain}
              chainId={chainId}
              to={to}
              params={params}
              customAmount={customAmount}
              setCustomAmount={setCustomAmount}
              showAmountInput={showAmountInput}
              setShowAmountInput={setShowAmountInput}
              selectedChain={selectedChain}
              setSelectedChain={setSelectedChain}
              setSelectedToken={setSelectedToken}
              offRampType={offRampType}
              offRampValue={offRampValue}
              offRampProvider={offRampProvider}
              accountName={accountName}
            />
          ) : (
            <PayWithWallet
              amount={amount}
              currency={currency}
              selectedToken={selectedToken}
              description={description}
              resolvedChain={resolvedChain}
              chainId={chainId}
              to={to}
              params={params}
              customAmount={customAmount}
              setCustomAmount={setCustomAmount}
              showAmountInput={showAmountInput}
              setShowAmountInput={setShowAmountInput}
              selectedChain={selectedChain}
              setSelectedChain={setSelectedChain}
              setSelectedToken={setSelectedToken}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-md h-[calc(100vh-80px)] overflow-y-auto">
        <div className="space-y-6">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg shadow-blue-500/25">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                <Image
                  src="/NEDApayLogo.png"
                  alt="NedaPay"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                NedaPay
              </h1>
              <p className="text-slate-400 text-sm">Secure Payment Gateway</p>
            </div>
          </motion.div>

          {/* Two-Step Flow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {currentStep === "details" ? (
              <DetailsView
                amount={amount}
                currency={currency}
                selectedToken={selectedToken}
                description={description}
                resolvedChain={resolvedChain}
                linkType={linkType}
                qrDataUrl={qrDataUrl}
                onProceedToPay={() => setCurrentStep("payment")}
              />
            ) : (
              <PaymentView
                amount={amount}
                currency={currency}
                selectedToken={selectedToken}
                description={description}
                resolvedChain={resolvedChain}
                linkType={linkType}
                chainId={chainId}
                to={to}
                params={params}
                customAmount={customAmount}
                setCustomAmount={setCustomAmount}
                showAmountInput={showAmountInput}
                setShowAmountInput={setShowAmountInput}
                selectedChain={selectedChain}
                setSelectedChain={setSelectedChain}
                setSelectedToken={setSelectedToken}
                offRampType={offRampType}
                offRampValue={offRampValue}
                offRampProvider={offRampProvider}
                accountName={accountName}
                onBackToDetails={() => setCurrentStep("details")}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
