"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaCirclePlus } from "react-icons/fa6";

import Header from '../../components/Header';
import { stablecoins } from '../../data/stablecoins';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [paymentCollection, setPaymentCollection] = useState("one-time");
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const stablecoinOptions = [{ baseToken: 'USDC', name: 'USD Coin' }, ...stablecoins];
  const [currency, setCurrency] = useState(stablecoinOptions[0]?.baseToken || "USDC");
  const [lineItems, setLineItems] = useState([{ description: "", amount: "" }]);
  const [status, setStatus] = useState<string | null>(null);

  const handleLineItemChange = (idx: number, field: string, value: string) => {
    setLineItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLineItem = () => setLineItems([...lineItems, { description: "", amount: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: "some-merchant-id", // Replace with dynamic merchant ID
          recipient,
          email,
          paymentCollection,
          dueDate,
          currency,
          lineItems,
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        setStatus(errorData.error || "Failed to create invoice");
        return;
      }
      const data = await res.json();
      setStatus("success");
      setTimeout(() => router.push(`/invoice/${data.id}`), 1200);
    } catch (err: any) {
      setStatus(err.message || "Unknown error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 dark:text-blue-400 dark:hover:bg-gray-800"
          >
            <span className="text-xl">←</span>
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-100 rounded-xl dark:bg-gray-700">
              <FaFileInvoiceDollar className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Invoice</h1>
              <p className="text-gray-500 dark:text-gray-300">Fill in the details below to send a payment request</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Recipient (Company or Name)
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Payment Collection <span className="text-blue-500 cursor-help" title="Payment frequency">ⓘ</span>
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={paymentCollection}
                  onChange={e => setPaymentCollection(e.target.value)}
                >
                  <option value="one-time">One-time Payment</option>
                  <option value="recurring">Recurring Payments</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Payment Currency
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

            <div className="space-y-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Invoice Items
              </label>
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <input
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Item description"
                    value={item.description}
                    onChange={e => handleLineItemChange(idx, "description", e.target.value)}
                    required
                  />
                  <input
                    className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.amount}
                    onChange={e => handleLineItemChange(idx, "amount", e.target.value)}
                    required
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 dark:text-blue-400"
              >
                <FaCirclePlus className="text-lg" />
                Add Another Item
              </button>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                className="flex-1 py-4 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                onClick={() => setStatus("draft")}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold transition-all relative overflow-hidden"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaFileInvoiceDollar />
                    Send Invoice
                  </span>
                )}
              </button>
            </div>

            {status === "success" && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-xl dark:bg-green-900/30 dark:text-green-400">
                Invoice sent successfully!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}