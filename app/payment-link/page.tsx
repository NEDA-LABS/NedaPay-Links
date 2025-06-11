"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { stablecoins } from "../data/stablecoins";
import Footer from "../components/Footer";
import { useTheme } from "next-themes";
import { FaWhatsapp, FaTelegramPlane, FaEnvelope } from "react-icons/fa";

interface PaymentLink {
  id: string;
  createdAt: string;
  amount: string;
  currency: string;
  status: string;
  url: string;
  description?: string;
}

export default function PaymentLinkPage() {
  const { authenticated, user } = usePrivy();
  
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;

  // Robust merchant address getter: wagmi first, then localStorage fallback
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
  const [currency, setCurrency] = useState("TSHC");
  const [description, setDescription] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [recentLinks, setRecentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useTheme();

  // Handle initial page load and cookie setting
  useEffect(() => {
    setIsClient(true);
    console.log("Payment Link Page - Loading, isConnected:", isConnected);

    // Fetch recent links for the current merchant address
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

    // Force set the wallet_connected cookie
    document.cookie = "wallet_connected=true; path=/; max-age=86400";

    const handleBeforeUnload = () => {
      console.log("Payment Link Page - Before unload event fired");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isConnected, walletAddress]);

  // Effect to monitor connection state
  useEffect(() => {
    if (pageLoaded) {
      console.log(
        "Payment Link Page - Connection state changed, isConnected:",
        isConnected
      );
      document.cookie = "wallet_connected=true; path=/; max-age=86400";
    }
  }, [isConnected, pageLoaded]);

  const handleCreateLink = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Generating payment link via API...");
    setIsLoading(true);

    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      setIsLoading(false);
      return;
    }
    const merchantAddress = getMerchantAddress();
    if (!merchantAddress) {
      alert("Wallet address not found. Please connect your wallet.");
      setIsLoading(false);
      return;
    }

    // Generate a mock link ID
    const linkId = Math.random().toString(36).substring(2, 10);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/pay/${linkId}?amount=${amount}¤cy=${currency}&to=${merchantAddress}&description=${encodeURIComponent(description || '')}`;

    try {
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId: merchantAddress,
          url: link,
          amount,
          currency,
          description: description || undefined,
          status: "Active",
        }),
      });

      if (response.ok) {
        const newLink = await response.json();
        setGeneratedLink(link);
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
    // Ensure cookie persists
    document.cookie = "wallet_connected=true; path=/; max-age=86400";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const phone = prompt("Please enter the phone number (with country code, e.g., +1234567890):");
    if (phone) {
      const message = `Pay ${amount} ${currency} for ${description || 'your purchase'}: ${generatedLink}`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareViaTelegram = () => {
    const telegramId = prompt("Please enter the Telegram handle (e.g., @username) or phone number (with country code, e.g., +1234567890):");
    if (telegramId) {
      const message = `Pay ${amount} ${currency} for ${description || 'your purchase'}: ${generatedLink}`;
      let telegramUrl;
      if (telegramId.startsWith('@')) {
        telegramUrl = `https://t.me/${telegramId.substring(1)}?text=${encodeURIComponent(message)}`;
      } else {
        telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent(message)}`;
      }
      window.open(telegramUrl, '_blank');
    }
  };

  const shareViaEmail = () => {
    const subject = `Payment Request: ${amount} ${currency}`;
    const body = `Please make a payment of ${amount} ${currency} for ${description || 'your purchase'} using this link: ${generatedLink}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Header />
      
      {/* Back Button */}
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
        {/* Updated Hero Section */}
        <div className="text-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 to-purple-200/30 blur-3xl rounded-4xl"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium animate-pulse">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            Payment Link Generator
          </div>
          <h1 className="text-lg md:text-6xl font-extrabold text-gray-900 mb-1 tracking-tight">
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Instant Payment Links
            </span>
          </h1>
          <p className="text-xs md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed pb-2 px-2">
            Effortlessly generate secure Web3 payment links.
          </p>
        </div>

        {/* Wallet Status Card */}
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
                <p className={`text-xs ${
                  getMerchantAddress() ? "text-green-700" : "text-amber-700"
                } font-mono break-all mt-1`}>
                  {getMerchantAddress() || "Please connect your wallet to create payment links"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 mb-12">
          <div className="space-y-4">
            {/* Amount Input */}
            <div className="group">
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-6 py-4 text-xs rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="group">
              <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-3">
                Currency
              </label>
              <div className="relative">
                <select
                  id="currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-6 py-4 text-xs rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                >
                  {stablecoins.map((coin: any) => (
                    <option key={coin.baseToken} value={coin.baseToken}>
                      {coin.baseToken} - {coin.name || coin.currency || coin.region}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div className="group">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-4 text-xs rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                placeholder="Payment for services, products, or invoices..."
              />
            </div>

            {/* Generate Button */}
            <form onSubmit={handleCreateLink}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-8 !bg-gradient-to-r from-blue-600 to-blue-500 hover:!from-indigo-700 hover:!to-purple-700 text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Link...
                  </div>
                ) : (
                  <div className="flex text-sm items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Generate Payment Link
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Updated Generated Link Display with Preview and Sharing Options */}
          {generatedLink && (
            <div className="mt-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" stroke="true" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-green-900">
                  Payment Link Generated Successfully!
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 ">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 !text-xs px-4 py-3 !bg-white !border-2 !border-green-200 !rounded-xl !text-sm !font-mono"
                />
                <div className="flex items-center gap-3">
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 !rounded-xl !font-medium !transition-all !duration-300 ${
                    copied
                      ? "!bg-green-600 !text-white text-xs"
                      : "!bg-green-100 !text-green-700 hover:!bg-green-200 text-xs"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 text-xs"
                >
                  Preview
                </a>
                </div>
               
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={shareViaWhatsApp}
                  className="px-4 py-2 !bg-green-500 text-xs !text-white !rounded-xl !font-medium hover:!bg-green-600 transition-all duration-300 flex items-center gap-2"
                >
                  <FaWhatsapp />
                </button>
                <button
                  onClick={shareViaTelegram}
                  className="px-4 py-2 !bg-blue-500 text-xs !text-white !rounded-xl !font-medium hover:!bg-blue-600 transition-all duration-300 flex items-center gap-2"
                >
                  <FaTelegramPlane />
                </button>
                <button
                  onClick={shareViaEmail}
                  className="px-4 py-2 !bg-gray-500 text-xs !text-white !rounded-xl !font-medium hover:!bg-gray-600 transition-all duration-300 flex items-center gap-2"
                >
                  <FaEnvelope />
                </button>
              </div>
              <p className="mt-3 text-xs text-green-700 text-center">
                Share this secure link with your customers to receive payments instantly.
              </p>
            </div>
          )}
        </div>

        {/* Recent Links Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2v2H6a2 2 0 00-2 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Recent Payment Links</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {recentLinks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-gray-100 rounded-2xl">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-lg">No payment links created yet</p>
                          <p className="text-gray-400 text-sm">Your generated links will appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentLinks.map((link, index) => (
                      <tr
                        key={link.id}
                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                          {link.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                          {link.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            {link.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            {link.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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