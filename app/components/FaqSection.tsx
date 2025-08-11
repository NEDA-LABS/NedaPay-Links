import React, { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Shield,
  Globe,
  CreditCard,
  DollarSign,
  MessageCircle,
  FileText,
} from "lucide-react";

export default function ProfessionalFaqSection() {
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqs = [
    {
      icon: HelpCircle,
      iconColor: "from-blue-500 to-blue-600",
      question: "What is NEDA Pay?",
      answer:
        " NEDA Pay is a seamless platform for merchants and creators to get paid in local stablecoins. Whether you're online or on the ground, you can easily generate payment links & invoices, manage, swap, and withdraw your earnings & funds straight to your bank or mobile as well as keep track of performance and growth.",
    },
    {
      icon: CreditCard,
      iconColor: "from-emerald-500 to-emerald-600",
      question: "How do I receive stablecoin payments?",
      answer:
        "Just sign up with your email with social login or simply connect your wallet, create a payment link or QR code or generate an invoice and share it with your customers. Payments arrive instantly, and you have the option to either swap to your preferred currency or withdraw to your bank account instantly, no delays, no hassle.",
    },
    {
      icon: Shield,
      iconColor: "from-violet-500 to-violet-600",
      question: "Is NEDA Pay secure?",
      answer:
        " Absolutely. Your private keys stay with you. NEDA Pay uses secure wallet connections and processes all transactions transparently on-chain, so you stay in control at all times. You have a dashboard that displays all transactions in real time.",
    },
    {
      icon: Globe,
      iconColor: "from-cyan-500 to-cyan-600",
      question: "Can I use NEDA Pay internationally?",
      answer:
        " Yes, you can accept payments from anyone, anywhere instantly with ease. NEDA Pay has you covered.",
    },
    {
      icon: DollarSign,
      iconColor: "from-amber-500 to-amber-600",
      question: "What fees does NEDA Pay charge?",
      answer:
        " We keep it simple and affordable with low transaction fees on every payment. Full details are available in your merchant dashboard or on our website.",
    },
  ];

  return (
    <section
      id="faq"
      className="relative py-12 px-6 z-10"
    >
     <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute top-0 left-0 z-[-1]">
          <defs>
            <linearGradient id="a" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stop-color="#0000000" />
              <stop offset="0.6" stop-color="#32004a" stop-opacity="1" />
              <stop offset="1" stop-color="#000000" />
            </linearGradient>
          </defs>
          <pattern id="b" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle fill="#ffffff" cx="12" cy="12" r="12" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#a)" />
          <rect width="100%" height="100%" fill="url(#b)" fill-opacity="0.05" />
        </svg>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-medium text-sm mb-6">
            <HelpCircle className="w-4 h-4" />
            Support
          </div> */}
          <h2 className="!text-lg md:!text-2xl font-bold text-slate-50 mb-6 leading-tight bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="!text-sm text-slate-50 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about NEDA Pay and how it works for
            your business
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-16 z-1000">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            const isExpanded = expandedFaqs[index];

            return (
              <div
                key={index}
                className="group bg-slate-950 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-300/60"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-2 flex items-center justify-between bg-slate-800 hover:bg-slate-50/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 flex items-center justify-center mr-4 group-hover:shadow-md transition-all duration-300 flex-shrink-0`}
                    >
                      <Icon
                        className="w-4 h-4 md:w-6 md:h-6 text-slate-50"
                        strokeWidth={2.5}
                      />
                    </div>
                    <h3 className="!text-sm md:!text-lg font-semibold text-slate-50 group-hover:text-slate-800 transition-colors duration-300 pr-4">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 group-hover:bg-slate-200 flex items-center justify-center transition-colors duration-300">
                      <ChevronDown
                        className={`h-4 w-4 text-slate-100 transform transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Answer Content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6 bg-slate-50/30 border-t border-slate-100">
                    <div className="pt-4">
                      <p className="text-slate-50 leading-relaxed !text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
