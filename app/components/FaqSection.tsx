import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqSection() {
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqs = [
    {
      icon: "❓",
      question: "What is NEDA Pay?",
      answer: "NEDA Pay is a platform that enables merchants to accept and manage local stablecoin payments easily and securely on the Base blockchain."
    },
    {
      icon: "💰",
      question: "How do I receive stablecoin payments?",
      answer: "Simply connect your Base wallet, generate payment links or QR codes, and share them with your customers. Payments are settled instantly to your wallet in local stablecoins."
    },
    {
      icon: "🔒",
      question: "Is NEDA Pay secure?",
      answer: "Yes! NEDA Pay uses secure wallet connections and never stores your private keys. All transactions happen directly on the blockchain for full transparency and safety."
    },
    {
      icon: "🌎",
      question: "Can I use NEDA Pay internationally?",
      answer: "Yes, NEDA Pay enables merchants to accept stablecoin payments from customers around the world, as long as they use supported wallets and stablecoins on the Base blockchain."
    },
    {
      icon: "💸",
      question: "What fees does NEDA Pay charge?",
      answer: "NEDA Pay charges low transaction fees for each payment processed. You can view the detailed fee structure in your merchant dashboard or on our website."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Find answers to common questions about NEDA Pay and how it works
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-4 sm:p-5 flex items-center justify-between !bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex items-center text-left">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                    <span className="text-lg">{faq.icon}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                </div>
                <div className="flex-shrink-0">
                  <ChevronDown
                    className={`h-5 w-5 text-white transform transition-transform duration-300 ${
                      expandedFaqs[index] ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Answer Content */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedFaqs[index] 
                    ? "max-h-96 opacity-100" 
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100">
                  <p className="text-slate-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 pt-6 border-t border-slate-200">
          <p className="text-slate-600 mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-black font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Contact Support
            </button>
            <button className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}