"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaFileInvoiceDollar, FaDownload, FaShare, FaPrint, FaCopy, FaCalendarAlt, FaUser, FaEnvelope, FaCreditCard } from "react-icons/fa";
import { FaArrowLeft, FaCheck } from "react-icons/fa6";
import { Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import Header from '../../components/Header';

interface LineItem {
  id: string;
  description: string;
  amount: number;
}

interface Invoice {
  id: string;
  createdAt: string;
  recipient: string;
  email: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentLink?: { url: string } | null;
  lineItems: LineItem[];
  dueDate: string;
  paymentCollection: string;
}

export default function InvoiceViewPage() {
  const { authenticated, user } = usePrivy();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'outstanding': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sent': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'partial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return '✓';
      case 'overdue': return '⚠';
      case 'outstanding': return '○';
      case 'sent': return '→';
      case 'draft': return '◐';
      case 'partial': return '◑';
      default: return '○';
    }
  };

  // Fetch invoice details
  useEffect(() => {
    if (!user) {
      setError("Please connect your wallet to view invoice.");
      setIsLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/send-invoice/invoices/${invoiceId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch invoice");
        }

        const invoiceData = await res.json();
        setInvoice(invoiceData);
      } catch (err: any) {
        setError(err.message || "Failed to fetch invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, user]);

  // Handle Download PDF
  const handleDownload = async () => {
    if (!invoice) return;
    
    try {
      const res = await fetch(`/api/send-invoice/invoices/${invoice.id}/pdf`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download invoice PDF");
    }
  };

  // Handle Share Payment Link
  const handleShare = async () => {
    if (!invoice?.paymentLink?.url) {
      setError("No payment link available for this invoice");
      return;
    }

    try {
      await navigator.clipboard.writeText(invoice.paymentLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy payment link");
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="text-center">
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 max-w-md mx-auto">
              {error}
            </div>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-white font-semibold !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-white font-semibold !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto max-w-4xl px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 px-4 py-2 !bg-white/80 !backdrop-blur-sm !border !border-gray-200 !rounded-xl hover:!bg-white hover:!shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900 print:hidden"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Invoices
        </button>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8 print:hidden">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 !bg-green-600 hover:!bg-green-700 !text-white font-medium !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300"
          >
            <FaDownload className="w-4 h-4" />
            Download PDF
          </button>
          
          {invoice.paymentLink?.url && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 !bg-purple-600 hover:!bg-purple-700 !text-white font-medium !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300"
            >
              {copied ? <FaCheck className="w-4 h-4" /> : <FaShare className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share Link'}
            </button>
          )}
          
          {/* <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 !bg-gray-600 hover:!bg-gray-700 !text-white font-medium !rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300"
          >
            <FaPrint className="w-4 h-4" />
            Print
          </button> */}
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FaFileInvoiceDollar className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">INVOICE</h1>
                </div>
                <p className="text-white/90 text-lg">Payment Request</p>
              </div>
              <div className="text-right">
                <p className="text-white/90 text-sm mb-2">Invoice ID</p>
                <p className="text-2xl font-bold">#{invoice.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status Banner */}
            <div className="mb-8 p-4 bg-gray-50 rounded-2xl border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Status</h3>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(invoice.status)} flex items-center gap-2`}>
                      <span>{getStatusIcon(invoice.status)}</span>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Bill To */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaUser className="w-4 h-4 text-purple-600" />
                  Bill To
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Recipient</p>
                    <p className="font-semibold text-gray-900">{invoice.recipient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <FaEnvelope className="w-3 h-3" />
                      Email
                    </p>
                    <p className="font-medium text-gray-700">{invoice.email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaCreditCard className="w-4 h-4 text-purple-600" />
                  Payment Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">{invoice.paymentCollection}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <FaCalendarAlt className="w-3 h-3" />
                      Due Date
                    </p>
                    <p className="font-medium text-red-600">
                      {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Currency</p>
                    <p className="font-semibold text-gray-900">{invoice.currency}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Items & Services</h3>
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {invoice.lineItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"} hover:bg-gray-50 transition-colors duration-200`}
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                          {invoice.currency} {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl p-8 text-center text-white mb-8">
              <p className="text-lg mb-2 opacity-90">Total Amount Due</p>
              <p className="text-4xl font-bold">
                {invoice.currency} {invoice.totalAmount.toFixed(2)}
              </p>
            </div>

            {/* Payment Link */}
            {invoice.paymentLink?.url && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Payment Link Available</h3>
                <div className="space-y-4">
                  <a
                    href={invoice.paymentLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Pay Now
                  </a>
                  <div className="text-sm text-green-700">
                    <p className="mb-2">Or copy the payment link:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="bg-white px-3 py-2 rounded-lg text-xs break-all max-w-xs truncate">
                        {invoice.paymentLink.url}
                      </code>
                      <button
                        onClick={handleShare}
                        className="p-2 !bg-green-100 hover:!bg-green-200 !rounded-lg transition-colors duration-200"
                      >
                        {copied ? <FaCheck className="w-4 h-4 text-green-600" /> : <FaCopy className="w-4 h-4 text-green-600" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600">
              <p className="mb-2">Thank you for your business!</p>
              <p className="text-sm">If you have any questions about this invoice, please contact us.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .bg-gradient-to-br {
            background: white !important;
          }
          
          .shadow-2xl {
            box-shadow: none !important;
          }
          
          .rounded-3xl {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}