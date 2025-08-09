"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import { usePrivy } from "@privy-io/react-auth";
import { stablecoins } from "../data/stablecoins";
import Footer from "../components/Footer";
import { useTheme } from "next-themes";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaDownload,
  FaShareAlt,
} from "react-icons/fa";
import { siX, siFarcaster } from "simple-icons";
import QRCode from "qrcode";
import { SUPPORTED_CHAINS } from "./chains";
import {
  fetchSupportedCurrencies,
  fetchSupportedInstitutions,
} from "@/utils/paycrest";
import { withDashboardLayout } from "@/utils/withDashboardLayout";

const XIcon = ({ size = 24, color = siX.hex }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={`#${color}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={siX.path} />
  </svg>
);

const FarcasterIcon = ({ size = 24, color = siFarcaster.hex }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={`#${color}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={siFarcaster.path} />
  </svg>
);

interface PaymentLink {
  id: string;
  createdAt: string;
  amount: string;
  currency: string;
  status: string;
  url: string;
  description?: string;
  expiresAt: string;
  linkId: string;
  linkType: "NORMAL" | "OFF_RAMP";
  offRampType?: "PHONE" | "BANK_ACCOUNT";
  offRampValue?: string;
  accountName?: string;
  offRampProvider?: string;
  chainId?: number;
}

function PaymentLinkPage() {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;

  const getMerchantAddress = () => {
    if (walletAddress && walletAddress.length > 10) return walletAddress;
    if (typeof window !== "undefined") {
      const lsAddr = localStorage.getItem("walletAddress");
      if (lsAddr && lsAddr.length > 10) return lsAddr;
    }
    return "";
  };

  const [isClient, setIsClient] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [description, setDescription] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [recentLinks, setRecentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const [linkType, setLinkType] = useState<"NORMAL" | "OFF_RAMP">("NORMAL");
  const [offRampType, setOffRampType] = useState<"PHONE" | "BANK_ACCOUNT">(
    "PHONE"
  );
  const [offRampValue, setOffRampValue] = useState("");
  const [accountName, setAccountName] = useState("");
  const [offRampProvider, setOffRampProvider] = useState("");
  const [supportedInstitutions, setSupportedInstitutions] = useState<
    Array<{ name: string; code: string; type: string }>
  >([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState<any[]>([]);
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [chainId, setChainId] = useState(8453); // Default to Base
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [specifyChain, setSpecifyChain] = useState(true); // New state for chain specification
  const [specifyCurrency, setSpecifyCurrency] = useState(true); // New state for currency specification

  // Input sanitization
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>{}]/g, "").substring(0, 1000);
  };

  // Input validation
  const validateInput = (): boolean => {
    // For normal links, amount is optional
    if (linkType === "NORMAL" && amount) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) return false;
      if (parsedAmount < 0) return false;
      
      // If amount is specified, currency must be specified
      if (!specifyCurrency) {
        alert("Please specify a currency when setting an amount");
        return false;
      }
    }

    // For off-ramp links, amount is required
    if (linkType === "OFF_RAMP") {
      if (!amount) return false;
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) return false;
      if (parsedAmount <= 0) return false;
    }

    // Description validation
    if (description.length > 1000) return false;
    if (!/^[a-zA-Z0-9\s.,!?-]*$/.test(description)) return false;

    // Off-ramp specific validation
    if (linkType === "OFF_RAMP") {
      if (!offRampValue) return false;
      if (!offRampProvider) return false;
      if (offRampType === "BANK_ACCOUNT" && !accountName) return false;
    }

    return true;
  };

  useEffect(() => {
    setIsClient(true);
    console.log("Payment Link Page - Loading, isConnected:", isConnected);

    const fetchLinks = async () => {
      const merchantAddress = getMerchantAddress();
      if (merchantAddress) {
        try {
          const response = await fetch(
            `/api/payment-links?merchantId=${merchantAddress}`
          );
          if (response.ok) {
            const links = await response.json();
            setRecentLinks(
              links.map((link: any) => ({
                id: link.id,
                createdAt: new Date(link.createdAt).toLocaleDateString(
                  undefined,
                  { year: "numeric", month: "short", day: "numeric" }
                ),
                amount: link.amount,
                currency: link.currency,
                status: link.status,
                url: link.url,
                description: link.description,
                expiresAt: new Date(link.expiresAt).toLocaleDateString(
                  undefined,
                  { year: "numeric", month: "short", day: "numeric" }
                ),
                linkId: link.linkId,
                linkType: link.linkType || "NORMAL",
                chainId: link.chainId,
              }))
            );
          } else {
            setRecentLinks([]);
          }
        } catch (error) {
          console.error("Error fetching payment links:", error);
          setRecentLinks([]);
        }
      }
    };

    fetchLinks();
    setPageLoaded(true);
    document.cookie = "wallet_connected=true; path=/; max-age=86400";

    const handleBeforeUnload = () => {
      console.log("Payment Link Page - Before unload event fired");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isConnected, walletAddress]);

  useEffect(() => {
    if (pageLoaded) {
      console.log(
        "Payment Link Page - Connection state changed, isConnected:",
        isConnected
      );
      document.cookie = "wallet_connected=true; path=/; max-age=86400";
    }
  }, [isConnected, pageLoaded]);

  useEffect(() => {
    if (generatedLink) {
      generateQRCode(generatedLink);
    }
  }, [generatedLink, theme]);

  // Fetch supported institutions when currency changes
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        if (linkType === "OFF_RAMP") {
          const institutions = await fetchSupportedInstitutions(currency);
          setSupportedInstitutions(institutions);
          // Reset provider when currency changes
          setOffRampProvider("");
        }
      } catch (error) {
        console.error("Error fetching supported institutions:", error);
      }
    };
    fetchInstitutions();
  }, [currency, linkType]);

  // Fetch currencies when link type changes
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        if (linkType === "OFF_RAMP") {
          const currencies = await fetchSupportedCurrencies();
          setSupportedCurrencies(currencies);
          // Set first currency as default
          if (currencies.length > 0) {
            setCurrency(currencies[0].code);
          }
        } else {
          setSupportedCurrencies(stablecoins);
          setCurrency("USDC");
        }
      } catch (error) {
        console.error("Error fetching supported currencies:", error);
      }
    };
    fetchCurrencies();
  }, [linkType]);

  const generateQRCode = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: {
          dark: theme === "dark" ? "#ffffff" : "#000000",
          light: "#0000",
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `payment-link-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateLink = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    // Input validation
    if (!validateInput()) {
      setIsLoading(false);
      return;
    }

    const merchantAddress = getMerchantAddress();
    if (!merchantAddress) {
      alert("Wallet address not found. Please connect your wallet.");
      setIsLoading(false);
      return;
    }

    // Generate secure random link ID
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const linkId = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Sanitize inputs
    const sanitizedAmount = amount ? sanitizeInput(amount) : "0";
    const sanitizedDescription = sanitizeInput(description);

    try {
      const expiresAtValue =
        expirationEnabled && expiresAt
          ? new Date(expiresAt).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const payload: any = {
        merchantId: merchantAddress,
        amount: parseFloat(sanitizedAmount),
        description: sanitizedDescription || undefined,
        status: "Active",
        expiresAt: expiresAtValue,
        linkId,
        linkType,
      };

      // Add conditional fields for normal links
      if (linkType === "NORMAL") {
        if (specifyChain) payload.chainId = chainId;
        if (specifyCurrency) payload.currency = currency;
      } 
      // Add required fields for off-ramp
      else if (linkType === "OFF_RAMP") {
        payload.currency = currency;
        payload.offRampType = offRampType;
        payload.offRampValue = offRampValue;
        payload.offRampProvider = offRampProvider;
        payload.accountName = accountName;
      }

      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newLink = await response.json();
        setGeneratedLink(newLink.url);
        setRecentLinks((prev) => [
          {
            id: newLink.id,
            createdAt: new Date(newLink.createdAt).toLocaleDateString(
              undefined,
              { year: "numeric", month: "short", day: "numeric" }
            ),
            amount: newLink.amount,
            currency: newLink.currency,
            status: newLink.status,
            url: newLink.url,
            description: newLink.description,
            expiresAt: new Date(newLink.expiresAt).toLocaleDateString(
              undefined,
              { year: "numeric", month: "short", day: "numeric" }
            ),
            linkId: newLink.linkId,
            linkType: newLink.linkType || "NORMAL",
            chainId: newLink.chainId,
          },
          ...prev,
        ]);
      } else {
        const error = await response.json();
        alert(`Error creating payment link: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating payment link:", error);
      alert("Failed to create payment link. Please try again.");
    }

    setIsLoading(false);
    document.cookie = "wallet_connected=true; path=/; max-age=86400";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share functions
  const shareOnTwitter = () => {
    const text = `Receive crypto payments with this secure link: ${generatedLink}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareOnFarcaster = () => {
    alert("");
  };

  const shareOnTelegram = () => {
    const text = `Receive crypto payments with this secure link: ${generatedLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareOnWhatsApp = () => {
    const text = `Receive crypto payments with this secure link: ${generatedLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=800,height=600");
  };

  const shareViaEmail = () => {
    const subject = "Secure Crypto Payment Link";
    const body = `You can receive crypto payments using this secure link:\n\n${generatedLink}\n\n`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen mx-auto">
      <Header />

      {/* <div className="container mx-auto max-w-6xl px-4 pt-6">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-2 px-4 py-2 !bg-white/80 !backdrop-blur-sm !border !border-gray-200 !rounded-xl hover:!bg-white hover:!shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">
            ←
          </span>
          Back
        </button>
      </div> */}

      <div className="w-full px-4 py-8 max-w-6xl mx-auto">
        <div className="text-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 to-purple-200/30 blur-3xl rounded-4xl"></div>
          
          <h1 className="text-lg md:text-6xl font-extrabold text-gray-900 mb-1 tracking-tight">
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Instant Payment Links
            </span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed pb-2 px-2">
            Effortlessly generate payment links.
          </p>
        </div>

        {isClient && (
          <div
            className={`text-sm mb-8 p-3 rounded-2xl border-2 transition-all duration-300 ${
              getMerchantAddress()
                ? "text-sm bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100/50"
                : "text-sm bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100/50"
            } shadow-lg`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${
                  getMerchantAddress()
                    ? "text-sm bg-green-100"
                    : "text-sm bg-amber-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    getMerchantAddress() ? "text-green-600" : "text-amber-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold text-sm ${
                    getMerchantAddress() ? "text-green-900" : "text-amber-900"
                  }`}
                >
                  {getMerchantAddress()
                    ? "Wallet Connected"
                    : "Wallet Required"}
                </h3>
                <p
                  className={`text-xs ${
                    getMerchantAddress() ? "text-green-700" : "text-amber-700"
                  } font-mono break-all mt-1`}
                >
                  {getMerchantAddress() ||
                    "Please connect your wallet to create payment links"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white backdrop-blur-sm rounded-3xl p-4 md:p-10 shadow-2xl border border-white/20 mb-12">
          <div className="space-y-4">
            {/* Link Type Selector */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Link Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLinkType("NORMAL")}
                  className={`px-4 !py-2 rounded-2xl border-2 transition-all duration-300 ${
                    linkType === "NORMAL"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Normal Payment
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType("OFF_RAMP")}
                  className={`px-4 !py-2 rounded-2xl border-2 transition-all duration-300 ${
                    linkType === "OFF_RAMP"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Off-Ramp to Bank/Phone
                </button>
              </div>
            </div>

            {/* Off-Ramp Fields */}
            {linkType === "OFF_RAMP" && (
              <>
                {/* Currency for Off-Ramp - Now at the top */}
                <div className="group">
                  <label
                    htmlFor="currency"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      id="currency"
                      name="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                    >
                      {supportedCurrencies.map((currency: any) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} -{" "}
                          {currency.name ||
                            currency.currency ||
                            currency.region}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="offRampType"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    Off-Ramp Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOffRampType("PHONE")}
                      className={`px-4 py-2 rounded-2xl border-2 transition-all duration-300 ${
                        offRampType === "PHONE"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Phone Number
                    </button>
                    <button
                      type="button"
                      onClick={() => setOffRampType("BANK_ACCOUNT")}
                      className={`px-4 py-2 rounded-2xl border-2 transition-all duration-300 ${
                        offRampType === "BANK_ACCOUNT"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Bank Account
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="offRampValue"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    {offRampType === "PHONE" ? "Phone Number" : "Bank Account"}
                  </label>
                  <input
                    type="text"
                    value={offRampValue}
                    onChange={(e) => setOffRampValue(e.target.value)}
                    className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder={
                      offRampType === "PHONE"
                        ? "e.g. +2348123456789"
                        : "e.g. 0123456789"
                    }
                  />
                </div>

                <div className="group">
                  <label
                    htmlFor="accountName"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="group">
                  <label
                    htmlFor="offRampProvider"
                    className="block text-sm font-semibold text-gray-700 mb-3"
                  >
                    {offRampType === "PHONE" ? "Mobile Network" : "Bank"}
                  </label>
                  <div className="relative">
                    <select
                      id="offRampProvider"
                      name="offRampProvider"
                      value={offRampProvider}
                      onChange={(e) => setOffRampProvider(e.target.value)}
                      className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                    >
                      <option value="">
                        Select{" "}
                        {offRampType === "PHONE" ? "Mobile Network" : "Bank"}
                      </option>
                      {supportedInstitutions.map((institution) => (
                        <option key={institution.code} value={institution.code}>
                          {institution.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Normal Link Type Fields */}
            {linkType === "NORMAL" && (
              <>
                {/* Blockchain Network Option */}
                <div className="group">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="specifyChain"
                      checked={specifyChain}
                      onChange={(e) => setSpecifyChain(e.target.checked)}
                      className="mr-2 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="specifyChain"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Specify Blockchain Network?
                    </label>
                  </div>

                  {specifyChain && (
                    <div className="group">
                      <label
                        htmlFor="chain"
                        className="block text-sm font-semibold text-gray-700 mb-3"
                      >
                        Blockchain Network
                      </label>
                      <div className="relative">
                        <select
                          id="chain"
                          name="chain"
                          value={chainId}
                          onChange={(e) => setChainId(Number(e.target.value))}
                          className="w-full px-6 py-2 text-base !text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                        >
                          {SUPPORTED_CHAINS.map((chain) => (
                            <option key={chain.id} value={chain.id}>
                              {chain.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Currency Option */}
                <div className="group">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="specifyCurrency"
                      checked={specifyCurrency}
                      onChange={(e) => setSpecifyCurrency(e.target.checked)}
                      className="mr-2 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="specifyCurrency"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Specify Stablecoin?
                    </label>
                  </div>

                  {specifyCurrency && (
                    <div className="group">
                      <label
                        htmlFor="currency"
                        className="block text-sm font-semibold text-gray-700 mb-3"
                      >
                        Currency
                      </label>
                      <div className="relative">
                        <select
                          id="currency"
                          name="currency"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                        >
                          {stablecoins.map((coin: any) => (
                            <option key={coin.baseToken} value={coin.baseToken}>
                              {coin.baseToken} -{" "}
                              {coin.name || coin.currency || coin.region}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="group">
              <label
                htmlFor="amount"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Payment Amount{" "}
                {linkType === "OFF_RAMP" ? "(Required)" : "(Optional)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                placeholder="Payment for services, products, or invoices..."
              />
            </div>

            {/* Expiration Date */}
            <div className="group">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="expirationEnabled"
                  checked={expirationEnabled}
                  onChange={(e) => setExpirationEnabled(e.target.checked)}
                  className="mr-2 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="expirationEnabled"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Set Expiration Date
                </label>
              </div>

              {expirationEnabled && (
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-6 py-2 text-base text-slate-700 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleCreateLink}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-8 !bg-gradient-to-r from-blue-600 to-blue-500 hover:!from-indigo-700 hover:!to-purple-700 text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg
                      className="animate-spin w-5 h-5"
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
                    Generating Link...
                  </div>
                ) : (
                  <div className="flex text-sm items-center justify-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Generate Payment Link
                  </div>
                )}
              </button>
            </form>
          </div>

          {generatedLink && (
            <div className="mt-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      stroke="true"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-green-900">
                  Payment Link Generated Successfully!
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 !text-base !text-slate-700 px-4 py-3 !bg-white !border-2 !border-green-200 !rounded-xl !text-sm !font-mono"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 !rounded-xl !font-medium !transition-all !duration-300 ${
                      copied
                        ? "!bg-green-600 !text-white text-base"
                        : "!bg-green-100 !text-green-700 hover:!bg-green-200 text-base"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 text-base"
                  >
                    Preview
                  </a>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="mt-6 flex flex-col items-center">
                {qrDataUrl && (
                  <>
                    <div className="mb-4 p-2 bg-white rounded-lg">
                      <img
                        src={qrDataUrl}
                        alt="Payment QR Code"
                        className="w-40 h-40"
                      />
                    </div>
                    <button
                      onClick={downloadQRCode}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2"
                    >
                      <FaDownload /> Download QR Code
                    </button>
                  </>
                )}
              </div>

              {/* Share Buttons */}
              <div className="mt-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-sm text-gray-500 font-medium">
                    Share via
                  </span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={shareOnTwitter}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300"
                    title="Share on X"
                  >
                    <XIcon size={20} />
                  </button>

                  <button
                    onClick={shareOnFarcaster}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300"
                    title="Share on Farcaster"
                  >
                    <FarcasterIcon size={20} />
                  </button>

                  <button
                    onClick={shareOnTelegram}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 text-blue-500"
                    title="Share on Telegram"
                  >
                    <FaTelegramPlane size={20} />
                  </button>

                  <button
                    onClick={shareOnWhatsApp}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 text-green-500"
                    title="Share on WhatsApp"
                  >
                    <FaWhatsapp size={20} />
                  </button>

                  <button
                    onClick={shareViaEmail}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 text-gray-600"
                    title="Share via Email"
                  >
                    <FaEnvelope size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent links table remains the same */}
      </div>

      <Footer />
    </div>
  );
}

export default withDashboardLayout(PaymentLinkPage);