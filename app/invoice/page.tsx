"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaPlus, FaEye, FaDownload, FaShare } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import Header from '../components/Header';
import { withDashboardLayout } from '../utils/withDashboardLayout';

interface Invoice {
  id: string;
  createdAt: string;
  recipient: string;
  email: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentLink?: { url: string } | null;
}

const statusTabs = ["All", "Draft", "Overdue", "Outstanding", "Paid", "Partial"];

function InvoicePage() {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;
  const merchantId = walletAddress;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // Number of invoices per page
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'outstanding': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'partial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Fetch invoices from backend
  useEffect(() => {
    if (!isConnected || !merchantId) {
      setError("Please connect your wallet to view invoices.");
      setInvoices([]);
      return;
    }

    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const statusFilter = activeTab === "All" ? "" : activeTab.toLowerCase();
        const res = await fetch(
          `/api/send-invoice/invoices?merchantId=${merchantId}&status=${statusFilter}&page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch invoices");
        }

        const { invoices, totalPages } = await res.json();
        setInvoices(invoices);
        setTotalPages(totalPages);
      } catch (err: any) {
        setError(err.message || "Failed to fetch invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [merchantId, isConnected, activeTab, page]);

  // Handle View action
  const handleView = (invoiceId: string) => {
    router.push(`/invoice/${invoiceId}`);
  };

  // Handle Edit action
  const handleEdit = (invoiceId: string) => {
    router.push(`/invoice/edit/${invoiceId}`);
  };

  // Handle Download action (client-side PDF generation or API call)
  const handleDownload = async (invoice: Invoice) => {
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

  // Handle Share action (copy payment link to clipboard)
  const handleShare = async (invoice: Invoice) => {
    if (invoice.paymentLink?.url) {
      try {
        await navigator.clipboard.writeText(invoice.paymentLink.url);
        alert("Payment link copied to clipboard!");
      } catch (err) {
        setError("Failed to copy payment link");
      }
    } else {
      setError("No payment link available for this invoice");
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <Header />
      <div className="w-full px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-blue-200/30 blur-3xl rounded-4xl"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-xs font-medium animate-pulse">
            <FaFileInvoiceDollar className="w-4 h-4" />
            Invoice Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            <span className="block bg-gradient-to-r from-purple-100 to-blue-100 bg-clip-text text-transparent">
              Invoice Management
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {new Date().toLocaleDateString("en-GB", { 
              weekday: 'long',
              day: "2-digit", 
              month: "long", 
              year: "numeric" 
            })}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="md:col-span-2 bg-gray-800 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl sm:rounded-2xl">
                <FaFileInvoiceDollar className="text-2xl sm:text-3xl text-purple-600" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Invoice</h2>
                <p className="text-white text-sm sm:text-base">Generate professional crypto invoices in seconds</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                router.push("/invoice/create");
              }}
              disabled={isLoading || !isConnected}
              className="w-full py-3 sm:py-4 px-6 sm:px-8 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-semibold text-base sm:text-lg !rounded-xl sm:!rounded-2xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FaPlus className="w-5 h-5" />
                )}
                Create Invoice
              </div>
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-gray-800 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Invoice Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-white text-xs sm:text-sm">Total Invoices</span>
                <span className="font-bold text-white text-lg sm:text-xl">{invoices.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs sm:text-sm">Paid</span>
                <span className="font-bold text-white text-lg sm:text-xl">
                  {invoices.filter(inv => inv.status.toLowerCase() === 'paid').length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs sm:text-sm">Outstanding</span>
                <span className="font-bold text-white text-lg sm:text-xl">
                  {invoices.filter(inv => inv.status.toLowerCase() === 'outstanding').length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs sm:text-sm">Overdue</span>
                <span className="font-bold text-white text-lg sm:text-xl">
                  {invoices.filter(inv => inv.status.toLowerCase() === 'overdue').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List Card */}
        <div className="relative bg-gray-800 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2 md:p-8 shadow-2xl border border-white/20 w-[340px] md:w-full mx-auto">
          <div className="flex flex-col md:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl">
                <FaFileInvoiceDollar className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Invoice History</h2>
            </div>
            
            {/* Status Filter Tabs */}
            <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl min-w-max">
                {statusTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setPage(1); // Reset to first page on tab change
                    }}
                    className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12 sm:py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="overflow-x-auto">
              <div className="relative w-full">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 sm:p-6 bg-gray-100 rounded-2xl sm:rounded-3xl">
                              <FaFileInvoiceDollar className="w-8 sm:w-12 h-8 sm:h-12 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
                              <p className="text-gray-500 text-sm sm:text-base mb-4">Create your first invoice to get started</p>
                              <button
                                onClick={() => router.push("/invoice/create")}
                                className="px-4 py-2 sm:px-6 sm:py-3 !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-white !font-semibold !rounded-lg sm:!rounded-xl !shadow-lg hover:!shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <div className="flex items-center gap-2">
                                  <FaPlus className="w-3 sm:w-4 h-3 sm:h-4" />
                                  Create First Invoice
                                </div>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice, index) => (
                        <tr
                          key={invoice.id}
                          className={`hover:bg-gray-50 transition-colors duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                            #{invoice.id.slice(0, 6)}...
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 max-w-[100px] truncate">
                            {invoice.recipient}
                          </td>
                          <td className="hidden sm:table-cell px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 max-w-[120px] truncate">
                            {invoice.email}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                            {invoice.totalAmount.toFixed(2)} {invoice.currency}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleView(invoice.id)}
                                className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="View Invoice"
                              >
                                <FaEye className="w-3 sm:w-4 h-3 sm:h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(invoice)}
                                className="p-1 sm:p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                title="Download Invoice"
                              >
                                <FaDownload className="w-3 sm:w-4 h-3 sm:h-4" />
                              </button>
                              <button
                                onClick={() => handleShare(invoice)}
                                className="p-1 sm:p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                                title="Share Payment Link"
                              >
                                <FaShare className="w-3 sm:w-4 h-3 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && invoices.length > 0 && (
            <div className="flex items-center justify-between mt-4 sm:mt-6">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 sm:px-4 sm:py-2 !rounded-lg sm:!rounded-xl !font-medium transition-all duration-300 ${
                  page === 1
                    ? '!bg-gray-100 !text-gray-400 !cursor-not-allowed'
                    : '!bg-white !text-gray-700 hover:!bg-gray-50 hover:!shadow-sm'
                }`}
              >
                Previous
              </button>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 sm:px-4 sm:py-2 !rounded-lg sm:!rounded-xl !font-medium transition-all duration-300 ${
                  page === totalPages
                    ? '!bg-gray-100 !text-gray-400 !cursor-not-allowed'
                    : '!bg-white !text-gray-700 hover:!bg-gray-50 hover:!shadow-sm'
                }`}
              >
                Next
              </button>
            </div>
          )}
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

export default withDashboardLayout(InvoicePage);