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
  const chainId = searchParams.get("chainId");
  const { address: connectedAddress } = useAccount();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [linkType, setLinkType] = useState<"NORMAL" | "OFF_RAMP">("NORMAL");
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  const merchantAddress =
    to && utils.isAddress(to) ? to : connectedAddress || "";
  const shortAddress = merchantAddress
    ? `${merchantAddress.slice(0, 6)}...${merchantAddress.slice(-4)}`
    : "";

  // Resolve chain info
  const resolvedChain =
    linkType === "OFF_RAMP"
      ? SUPPORTED_CHAINS.find((c) => c.id === Number(chainId))
      : selectedChain
        ? NORMAL_PAYMENT_CHAINS.find((c) => c.id === selectedChain)
        : chainId
          ? NORMAL_PAYMENT_CHAINS.find((c) => c.id === Number(chainId))
          : null;

  useEffect(() => {
    const validateLink = async () => {
      try {
        const response = await fetch(
          `/api/payment-links/validate/${params.id}?${searchParams.toString()}`
        );
        const data = await response.json();

        if (!response.ok) {
          setIsValidLink(false);
          setErrorMessage(data.error || "Invalid or expired payment link");
        } else {
          setIsValidLink(true);
          setLinkType(data.linkType || "NORMAL");

          // Generate QR code for the full URL
          const fullUrl = window.location.href;
          const url = await QRCode.toDataURL(fullUrl, {
            width: 400,
            margin: 2,
          });
          setQrDataUrl(url);

          // Set initial token and chain for normal payments
          if (data.linkType === "NORMAL") {
            // Set initial chain if not specified
            if (!chainId) {
              setSelectedChain(base.id); // Default to Base
            }

            // Set initial token if not specified
            if (!currency) {
              const usdcToken = stablecoins.find((t) => t.baseToken === "USDC");
              if (usdcToken) {
                setSelectedToken("USDC");
              }
            }
          }
        }
      } catch (error) {
        setIsValidLink(false);
        setErrorMessage("Error validating payment link");
      } finally {
        setIsLoading(false);
      }
    };

    // Only validate link if Privy is ready and user is authenticated
    if (ready && authenticated) {
      validateLink();
    } else if (ready && !authenticated) {
      setIsLoading(false);
    }
  }, [searchParams, ready, authenticated]);

  // Update available tokens when chain changes
  useEffect(() => {
    if (linkType === "NORMAL" && selectedChain) {
      const tokensForChain = stablecoins.filter(
        (token) => token.chainIds && token.chainIds.includes(selectedChain)
      );
      setAvailableTokens(tokensForChain);

      // Auto-select first token if none selected
      if (tokensForChain.length > 0 && !selectedToken) {
        setSelectedToken(tokensForChain[0].baseToken);
      }
    }
  }, [selectedChain, linkType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isTokenDropdownOpen && !target.closest(".token-dropdown-container")) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTokenDropdownOpen]);

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isTokenDropdownOpen) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTokenDropdownOpen]);

  const handleCopy = () => {
    if (merchantAddress) {
      navigator.clipboard.writeText(merchantAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `payment-${params.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmount || isNaN(Number(customAmount))) return;
    setShowAmountInput(false);
  };

  // Show loading while Privy is initializing
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {!ready ? "Initializing..." : "Validating Payment Link"}
                  </h1>
                  <p className="text-slate-600">
                    {!ready
                      ? "Setting up secure connection"
                      : "Verifying payment details"}
                  </p>
                </div>
                <Progress value={!ready ? 33 : 66} className="w-full" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!authenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                      Secure Access Required
                    </h1>
                    <p className="text-slate-600">
                      Please authenticate to access this payment page securely.
                    </p>
                  </div>

                  <Button
                    onClick={login}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Authenticate with Privy
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Secure Auth</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Instant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  // console.log("custom amount", customAmount); //debugging
  // console.log("amount", amount);

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-red-600">
                    Invalid Payment Link
                  </h1>
                  <p className="text-slate-600">{errorMessage}</p>
                </div>
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    This payment link may have expired or been modified. Please
                    contact the merchant for a new link.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            {/* Minimalist Brand Header */}
            <div className="text-center mb-6 space-y-3">
              
                <Image
                  src="/symbolnlogo.jpeg"
                  alt="NedaPay"
                  width={100}
                  height={50}
                  className="rounded-lg mx-auto"
                />
              
              <div>
                <p className="text-slate-100 text-xs">
                  {linkType === "OFF_RAMP" ? "Token to Fiat Payment Request" : "Token to Token Payment Request"}
                </p>
              </div>
            </div>

            {/* Main Payment Card */}
            <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden !rounded-2xl">

              <CardContent className="p-4 space-y-4">
                {/* Amount Display */}
                <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10 !rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-xs font-medium">
                      Amount
                    </span>
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
                    {linkType === "NORMAL" && (currency || selectedToken) && (
                      <Image
                        src={
                          stablecoins.find(
                            (t) => t.baseToken === (currency || selectedToken)
                          )?.flag || ""
                        }
                        alt={currency || selectedToken || ""}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {amount ? `${amount}` : "Any Amount"}
                      </div>
                      {linkType === "NORMAL" && (currency || selectedToken) && (
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
                      <Info className="w-3 h-3 text-blue-400" />
                      <h3 className="text-xs font-medium text-white">
                        Details
                      </h3>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {decodeURIComponent(description)}
                    </p>
                  </div>
                )}

                {/* Off-Ramp Recipient Info */}
                {linkType === "OFF_RAMP" && offRampValue && offRampProvider && (
                  <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-500/20">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-200 font-medium text-xs">
                          Recipient Details
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Provider:</span>
                          <span className="text-white capitalize">
                            {offRampProvider}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            {offRampType === "PHONE" ? "Phone:" : "Account:"}
                          </span>
                          <span className="text-white font-mono">
                            {offRampValue}
                          </span>
                        </div>
                        {accountName && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Name:</span>
                            <span className="text-white">{accountName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Premium Merchant Wallet Section */}
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="flex items-center justify-center">
                          <Wallet className="w-7 h-7 text-white" />
                        </div>
                        {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur-sm"></div> */}
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-semibold text-sm">
                          Merchant Wallet
                        </p>
                        <p className="text-slate-300 font-mono text-xs tracking-wider">
                          {shortAddress}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleCopy}
                      className="hover:from-blue-500/30 hover:to-purple-500/30 text-blue-200 h-12 w-12 p-0 rounded-xl backdrop-blur-sm transition-all duration-300"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <ClipboardCopy className="w-7 h-7" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Premium QR Code Section */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          Scan to Pay
                        </h3>
                      </div>
                      <p className="text-slate-300 text-xs">
                        Use any compatible wallet app
                      </p>
                    </div>

                    <div className="flex justify-center">
                      {qrDataUrl ? (
                        <div className="relative">
                          <div className="p-6 bg-white rounded-3xl shadow-2xl">
                            <img
                              src={qrDataUrl}
                              alt="Payment QR Code"
                              className="w-56 h-56"
                            />
                          </div>
                          {/* <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div> */}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-56 h-56 bg-red-900/30 rounded-3xl border border-red-400/30 backdrop-blur-sm">
                          <div className="text-center space-y-3">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                            <p className="text-red-300 font-medium">
                              QR Code Error
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Premium Chain and Token Selection */}
                {linkType === "NORMAL" && (!chainId || !currency) && (
                  <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl p-6 border border-amber-400/30 backdrop-blur-sm">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                          <Info className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-amber-200 font-semibold text-sm">
                          Configuration Required
                        </span>
                      </div>

                      {!chainId && (
                        <div className="space-y-3">
                          <Label
                            htmlFor="chain-select"
                            className="text-white font-medium text-sm"
                          >
                            Select Blockchain Network
                          </Label>
                          <Select
                            value={selectedChain?.toString() || ""}
                            onValueChange={(value) =>
                              setSelectedChain(Number(value))
                            }
                          >
                            <SelectTrigger className="w-full bg-slate-800/50 border-white/20 text-white h-12 rounded-xl backdrop-blur-sm">
                              <SelectValue
                                placeholder="Choose a network"
                                className="text-slate-300"
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/20 backdrop-blur-xl">
                              {NORMAL_PAYMENT_CHAINS.map((chain) => {
                                const chainConfig = SUPPORTED_CHAINS_NORMAL.find(c => c.id === chain.id);
                                return (
                                  <SelectItem
                                    key={chain.id}
                                    value={chain.id.toString()}
                                    className="text-white hover:bg-slate-700"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Image 
                                        src={chainConfig?.icon || '/base.svg'} 
                                        alt={chain.name} 
                                        width={16} 
                                        height={16} 
                                        className="rounded-full"
                                      />
                                      <span className="text-sm">{chain.name}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {!currency && selectedChain && (
                        <div className="space-y-3">
                          <Label className="text-white font-medium text-sm">
                            Select Token
                          </Label>
                          <Select
                            value={selectedToken}
                            onValueChange={setSelectedToken}
                          >
                            <SelectTrigger className="w-full bg-slate-800/50 border-white/20 text-white h-12 rounded-xl backdrop-blur-sm">
                              <SelectValue
                                placeholder="Choose a token"
                                className="text-slate-300"
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/20 backdrop-blur-xl">
                              {availableTokens.map((token) => (
                                <SelectItem
                                  key={token.baseToken}
                                  value={token.baseToken}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      src={token.flag}
                                      alt={`${token.baseToken} icon`}
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span className="font-medium">
                                      {token.baseToken} - {token.name}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Premium Amount Input Form */}
                <AnimatePresence>
                  {showAmountInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-400/30 backdrop-blur-sm">
                        <form
                          onSubmit={handleAmountSubmit}
                          className="space-y-6"
                        >
                          <div className="text-center space-y-2">
                            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">
                              Enter Payment Amount
                            </h3>
                            <p className="text-slate-300 text-xs">
                              Specify the amount in {currency || selectedToken}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Input
                              type="number"
                              id="customAmount"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder={`0.00`}
                              step="any"
                              min="0"
                              required
                              className="text-2xl font-bold text-center h-16 bg-slate-800/50 border-white/20 text-white placeholder:text-slate-400 rounded-xl backdrop-blur-sm"
                            />
                            <div className="text-center text-slate-300 font-medium text-sm">
                              {currency || selectedToken}
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <Button
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Confirm Amount
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setShowAmountInput(false)}
                              className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-white border border-white/20 h-12 rounded-xl font-semibold backdrop-blur-sm transition-all duration-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Premium Payment Action Buttons */}
                {linkType === "NORMAL" ? (
                  <div className="space-y-6">
                    {!amount && !showAmountInput && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => setShowAmountInput(true)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors duration-200 text-sm"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Wallet className="w-4 h-4" />
                            <span className="text-xs">
                              {!customAmount
                                ? "Enter Amount"
                                : `Update (${customAmount})`}
                            </span>
                          </div>
                        </Button>
                      </motion.div>
                    )}
                    {((!amount && customAmount) || amount) && (
                      <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                        <PayWithWallet
                          to={merchantAddress}
                          amount={
                            amount === "0" || amount === null
                              ? customAmount
                              : amount || ""
                          }
                          currency={currency || selectedToken || ""}
                          description={description || ""}
                          linkId={params.id}
                          chainId={
                            chainId
                              ? parseInt(chainId)
                              : selectedChain || undefined
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                    <OffRampPayment
                      to={merchantAddress}
                      amount={amount || customAmount || ""}
                      currency={currency || ""}
                      description={description || ""}
                      offRampType={offRampType as "PHONE" | "BANK_ACCOUNT"}
                      offRampValue={offRampValue || ""}
                      offRampProvider={offRampProvider || ""}
                      linkId={params.id}
                      accountName={accountName || ""}
                      chainId={chainId ? parseInt(chainId) : undefined}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
