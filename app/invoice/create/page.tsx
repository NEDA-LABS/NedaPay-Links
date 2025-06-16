"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaCirclePlus, FaPlus } from "react-icons/fa6";
import { usePrivy } from "@privy-io/react-auth";

import Header from '../../components/Header';
import { stablecoins } from '../../data/stablecoins';

export default function CreateInvoicePage() {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;

  const merchantAddress = walletAddress;

  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [senderId, setSenderId] = useState("");
  const [paymentCollection, setPaymentCollection] = useState("one-time");
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const stablecoinOptions = [{ baseToken: 'USDC', name: 'USD Coin' }, ...stablecoins];
  const [currency, setCurrency] = useState(stablecoinOptions[0]?.baseToken || "USDC");
  const [lineItems, setLineItems] = useState([{ description: "", amount: "" }]);
  const [status, setStatus] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentLinks, setPaymentLinks] = useState<{ id: string; url: string; createdAt: string }[]>([]);

  const handleLineItemChange = (idx: number, field: string, value: string) => {
    setLineItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLineItem = () => setLineItems([...lineItems, { description: "", amount: "" }]);

  // Fetch recent payment links
  useEffect(() => {
    const fetchPaymentLinks = async () => {
      // Only fetch if we have a merchant address
      if (!merchantAddress) {
        console.log("No merchant address available");
        return;
      }
      
      try {
        console.log("Fetching payment links for:", merchantAddress);
        const res = await fetch(`/api/payment-links?merchantId=${merchantAddress}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched payment links:", data);
          
          // Sort by createdAt (descending) and take top 3
          const sortedLinks = data
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          setPaymentLinks(sortedLinks);
        } else {
          const errorData = await res.json();
          console.error("Failed to fetch payment links:", errorData);
        }
      } catch (err) {
        console.error("Failed to fetch payment links:", err);
      }
    };
    
    fetchPaymentLinks();
  }, [merchantAddress]);

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: senderId,
          recipient,
          email,
          paymentCollection,
          dueDate,
          currency,
          lineItems,
          paymentLink, // Include payment link in payload
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setStatus(errorData.error || "Failed to create invoice");
        return;
      }
      const data = await res.json();
      setStatus("success");
      setTimeout(() => router.push(`/invoice`), 1200);
    } catch (err: any) {
      setStatus(err.message || "Unknown error");
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto max-w-4xl px-4 pt-6">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-2 px-4 py-2 !bg-white/80 !backdrop-blur-sm !border !border-gray-200 !rounded-xl hover:!bg-white hover:!shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span> 
          Back to Dashboard
        </button>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-blue-200/30 blur-3xl rounded-4xl"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium animate-pulse">
            <FaFileInvoiceDollar className="w-4 h-4" />
            Invoice Creation
          </div>
          <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create New Invoice
            </span>
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate professional crypto invoices with ease and send them instantly to your clients.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl">
              <FaFileInvoiceDollar className="text-3xl text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Invoice Details</h2>
              <p className="text-gray-600 text-sm">Fill in the information below to create your invoice</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Client Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Client Information
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Recipient (Company or Name)
                  </label>
                  <input
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="Enter client name or company"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="client@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

             {/* Business Information Section */}
             <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Sender Information
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Business/ Company/ Individual Name
                  </label>
                  <input
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your Name"
                    value={senderId}
                    onChange={e => setSenderId(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Settings Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Payment Settings
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Payment Collection
                    <span className="ml-2 text-blue-500 cursor-help" title="Payment frequency">ⓘ</span>
                  </label>
                  <select
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    value={paymentCollection}
                    onChange={e => setPaymentCollection(e.target.value)}
                  >
                    <option value="one-time">One-time Payment</option>
                    <option value="recurring">Recurring Payments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Payment Currency
                  </label>
                  <select
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    required
                  >
                    {stablecoinOptions.map((coin, idx) => (
                      <option key={`${coin.baseToken}-${idx}`} value={coin.baseToken}>
                        {coin.baseToken} - {coin.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Link Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Payment Link
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Select or Paste Payment Link
                  </label>
                  <select
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm mb-4"
                    value={paymentLink}
                    onChange={e => setPaymentLink(e.target.value)}
                  >
                    <option value="">Select a recent payment link</option>
                    {paymentLinks.map((link) => (
                      <option key={link.id} value={link.url} style={{ whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '50%' }}>
                        {link.url} (Created: {new Date(link.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="Or paste a payment link"
                    value={paymentLink}
                    onChange={e => setPaymentLink(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Invoice Items
                </h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-xl hover:from-purple-200 hover:to-blue-200 transition-all duration-300 text-sm font-medium"
                >
                  <FaCirclePlus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="flex-1">
                      <input
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white"
                        placeholder="Item description (e.g., Website Development)"
                        value={item.description}
                        onChange={e => handleLineItemChange(idx, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-40">
                      <input
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white text-right"
                        placeholder="0.00"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.amount}
                        onChange={e => handleLineItemChange(idx, "amount", e.target.value)}
                        required
                      />
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Display */}
              {totalAmount > 0 && (
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalAmount.toFixed(2)} {currency}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                className="flex-1 py-4 px-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white hover:shadow-lg text-gray-700 font-semibold transition-all duration-300"
                onClick={() => setStatus("draft")}
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="flex-1 py-4 px-6 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-semibold !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending Invoice...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaFileInvoiceDollar className="w-5 h-5" />
                    Send Invoice
                  </span>
                )}
              </button>
              
            </div>
            <span className="text-xs text-pink-400 pl-2">Recepient should check Junk Email if not received</span>
            {/* Status Messages */}
            {status === "success" && (
              <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold">Invoice sent successfully!</p>
                    <p className="text-sm text-green-600">Redirecting to dashboard...</p>
                  </div>
                </div>
              </div>
            )}

            {status && status !== "loading" && status !== "success" && status !== "draft" && (
              <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <div>
                    <p className="font-semibold">Error creating invoice</p>
                    <p className="text-sm text-red-600">{status}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      
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