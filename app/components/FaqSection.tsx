import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Shield, Globe, CreditCard, DollarSign, MessageCircle, FileText } from 'lucide-react';

export default function ProfessionalFaqSection() {
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqs = [
    {
      icon: HelpCircle,
      iconColor: "from-blue-500 to-blue-600",
      question: "What is NEDA Pay?",
      answer: " NEDA Pay is a seamless platform for merchants and creators to get paid in local stablecoins. Whether you're online or on the ground, you can easily generate payment links & invoices, manage, swap, and withdraw your earnings & funds straight to your bank or mobile as well as keep track of performance and growth."

    },
    {
      icon: CreditCard,
      iconColor: "from-emerald-500 to-emerald-600",
      question: "How do I receive stablecoin payments?",
      answer: "Just sign up with your email with social login or simply connect your wallet, create a payment link or QR code or generate an invoice and share it with your customers. Payments arrive instantly, and you have the option to either swap to your preferred currency or withdraw to your bank account instantly, no delays, no hassle."
    },
    {
      icon: Shield,
      iconColor: "from-violet-500 to-violet-600",
      question: "Is NEDA Pay secure?",
      answer: " Absolutely. Your private keys stay with you. NEDA Pay uses secure wallet connections and processes all transactions transparently on-chain, so you stay in control at all times. You have a dashboard that displays all transactions in real time."
    },
    {
      icon: Globe,
      iconColor: "from-cyan-500 to-cyan-600",
      question: "Can I use NEDA Pay internationally?",
      answer: " Yes, you can accept payments from anyone, anywhere instantly with ease. NEDA Pay has you covered."
    },
    {
      icon: DollarSign,
      iconColor: "from-amber-500 to-amber-600",
      question: "What fees does NEDA Pay charge?",
      answer: " We keep it simple and affordable with low transaction fees on every payment. Full details are available in your merchant dashboard or on our website."
    }
  ];

  return (
    <section id="faq" className="py-20 px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 mt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-medium text-sm mb-6">
            <HelpCircle className="w-4 h-4" />
            Support
          </div> */}
          <h2 className="text-2xl font-bold text-slate-50 mb-6 leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-50 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about NEDA Pay and how it works for your business
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            const isExpanded = expandedFaqs[index];
            
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-300/60"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-2 flex items-center justify-between bg-white hover:bg-slate-50/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`w-12 h-12 bg-gradient-to-br ${faq.iconColor} rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-800 transition-colors duration-300 pr-4">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors duration-300">
                      <ChevronDown
                        className={`h-4 w-4 text-slate-600 transform transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Answer Content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded 
                      ? "max-h-96 opacity-100" 
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6 bg-slate-50/30 border-t border-slate-100">
                    <div className="pt-4">
                      <p className="text-slate-700 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="bg-slate-50 rounded-b-2xl p-8 md:p-10 text-center relative overflow-hidden border !border-4 !border-slate-800">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
            }} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-slate-700 mb-3">
              Still have questions?
            </h3>
            <p className="text-slate-700 mb-8 text-sm">
              Our support team is here to help you get started with NEDA Pay
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <button className="w-full text-sm sm:w-auto group relative px-8 py-4 bg-blue-700 text-slate-50 font-semibold rounded-2xl hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <a
            href="https://discord.com/invite/2H3dQzruRV"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-50 hover:text-blue-600 transition-colors duration-300"
            aria-label="Discord Community"
          >
                Contact Support
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              </button>
              
              {/* <button className="w-full text-sm sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}