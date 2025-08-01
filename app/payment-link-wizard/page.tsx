"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import { usePrivy } from "@privy-io/react-auth";
import Footer from "../components/Footer";
import { useTheme } from "next-themes";
import { LinkTypeTabs } from "./LinkTypeTabs";
import { PaymentLinkForm } from "./PaymentLinkForm";
import { RecentLinksTable } from "./RecentLinksTable";
import { ShareLinkPanel } from "./ShareLinkPanel";
import { PaymentLink } from "./utils/types";

export default function PaymentLinkPage() {
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
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
  const [whatsAppReceiver, setWhatsAppReceiver] = useState("");
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [telegramReceiver, setTelegramReceiver] = useState("");
  const { theme } = useTheme();
  
  // Wizard states
  const [activeTab, setActiveTab] = useState('standard');
  const [expirationDate, setExpirationDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [chain, setChain] = useState('base');
  const [mobileNumber, setMobileNumber] = useState('');

  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>{}]/g, '').substring(0, 1000);
  };

  const validateInput = (amount: string, description: string): boolean => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return false;
    if (description.length > 1000) return false;
    if (!/^[a-zA-Z0-9\s.,!?-]*$/.test(description)) return false;
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
                type: link.type || 'standard',
                chain: link.chain || 'base',
                mobile: link.metadata?.mobile
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
      document.cookie = "wallet_connected=true; path=/; max-age=86400";
    }
  }, [isConnected, pageLoaded]);

  const handleCreateLink = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    // Input validation
    let valid = true;
    if (activeTab === 'offramp' && !/^\+?[1-9]\d{7,14}$/.test(mobileNumber)) {
      alert("Please enter a valid mobile number");
      valid = false;
    }
    if (!validateInput(amount, description)) {
      alert("Invalid input. Please check amount and description.");
      valid = false;
    }

    if (!valid) {
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
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Sanitize inputs
    const sanitizedAmount = sanitizeInput(amount);
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedMobile = sanitizeInput(mobileNumber);

    try {
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId: merchantAddress,
          amount: parseFloat(sanitizedAmount),
          currency,
          description: sanitizedDescription || undefined,
          status: "Active",
          expiresAt: expirationDate?.toISOString(),
          linkId,
          type: activeTab,
          chain,
          ...(activeTab === 'offramp' && { mobile: sanitizedMobile })
        }),
      });

      if (response.ok) {
        const newLink = await response.json();
        setGeneratedLink(newLink.url);
        setRecentLinks((prev) => [
          {
            id: newLink.id,
            merchantId: newLink.merchantId,
            signature: newLink.signature,
            createdAt: new Date(newLink.createdAt).toLocaleDateString(undefined, 
              { year: "numeric", month: "short", day: "numeric" }
            ),
            amount: newLink.amount,
            currency: newLink.currency,
            status: newLink.status,
            url: newLink.url,
            description: newLink.description,
            expiresAt: new Date(newLink.expiresAt).toLocaleDateString(undefined, 
              { year: "numeric", month: "short", day: "numeric" }
            ),
            linkId: newLink.linkId,
            type: newLink.type,
            chain: newLink.chain,
            mobile: newLink.mobile
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
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-2 px-4 py-2 !bg-white/80 !backdrop-blur-sm !border !border-gray-200 !rounded-xl hover:!bg-white hover:!shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span> 
          Back
        </button>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 to-purple-200/30 blur-3xl rounded-4xl"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium animate-pulse">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            Payment Link Wizard
          </div>
          <h1 className="text-lg md:text-6xl font-extrabold text-gray-900 mb-1 tracking-tight">
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Instant Payment Links
            </span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed pb-2 px-2">
            Effortlessly generate secure Web3 payment links.
          </p>
        </div>

        {isClient && (
          <div className={`text-sm mb-8 p-3 rounded-2xl border-2 transition-all duration-300 ${
            getMerchantAddress()
              ? "text-sm bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100/50"
              : "text-sm bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100/50"
          } shadow-lg`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                getMerchantAddress() ? "text-sm bg-green-100" : "text-sm bg-amber-100"
              }`}>
                <svg className={`w-6 h-6 ${
                  getMerchantAddress() ? "text-green-600" : "text-amber-600"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${
                  getMerchantAddress() ? "text-green-900" : "text-amber-900"
                }`}>
                  {getMerchantAddress() ? "Wallet Connected" : "Wallet Required"}
                </h3>
                <p className={`text-base ${
                  getMerchantAddress() ? "text-green-700" : "text-amber-700"
                } font-mono break-all mt-1`}>
                  {getMerchantAddress() || "Please connect your wallet to create payment links"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 mb-12">
          <LinkTypeTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <PaymentLinkForm
            activeTab={activeTab}
            amount={amount}
            setAmount={setAmount}
            currency={currency}
            setCurrency={setCurrency}
            description={description}
            setDescription={setDescription}
            expirationDate={expirationDate}
            setExpirationDate={setExpirationDate}
            chain={chain}
            setChain={setChain}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            isLoading={isLoading}
            handleCreateLink={handleCreateLink}
          />

          {generatedLink && (
            <ShareLinkPanel
              generatedLink={generatedLink}
              copied={copied}
              copyToClipboard={copyToClipboard}
              amount={amount}
              currency={currency}
              description={description}
              showWhatsAppInput={showWhatsAppInput}
              setShowWhatsAppInput={setShowWhatsAppInput}
              whatsAppReceiver={whatsAppReceiver}
              setWhatsAppReceiver={setWhatsAppReceiver}
              showTelegramInput={showTelegramInput}
              setShowTelegramInput={setShowTelegramInput}
              telegramReceiver={telegramReceiver}
              setTelegramReceiver={setTelegramReceiver}
            />
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2v2H6a2 2 0 00-2 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Recent Payment Links</h2>
          </div>

          <RecentLinksTable recentLinks={recentLinks} />
        </div>
      </div>
      
      <Footer />
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}