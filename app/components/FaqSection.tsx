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
      answer: "NEDA Pay is a platform that enables merchants to accept and manage local stablecoin payments easily and securely on the Base blockchain."
    },
    {
      icon: CreditCard,
      iconColor: "from-emerald-500 to-emerald-600",
      question: "How do I receive stablecoin payments?",
      answer: "Simply connect your Base wallet, generate payment links or QR codes, and share them with your customers. Payments are settled instantly to your wallet in local stablecoins."
    },
    {
      icon: Shield,
      iconColor: "from-violet-500 to-violet-600",
      question: "Is NEDA Pay secure?",
      answer: "Yes! NEDA Pay uses secure wallet connections and never stores your private keys. All transactions happen directly on the blockchain for full transparency and safety."
    },
    {
      icon: Globe,
      iconColor: "from-cyan-500 to-cyan-600",
      question: "Can I use NEDA Pay internationally?",
      answer: "Yes, NEDA Pay enables merchants to accept stablecoin payments from customers around the world, as long as they use supported wallets and stablecoins on the Base blockchain."
    },
    {
      icon: DollarSign,
      iconColor: "from-amber-500 to-amber-600",
      question: "What fees does NEDA Pay charge?",
      answer: "NEDA Pay charges low transaction fees for each payment processed. You can view the detailed fee structure in your merchant dashboard or on our website."
    }
  ];

  return (
    <section id="faq" className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-medium text-sm mb-6">
            <HelpCircle className="w-4 h-4" />
            Support Center
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Frequently Asked
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"> Questions</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
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
                  className="w-full p-6 flex items-center justify-between bg-white hover:bg-slate-50/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`w-12 h-12 bg-gradient-to-br ${faq.iconColor} rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-800 transition-colors duration-300 pr-4">
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
                      <p className="text-slate-700 leading-relaxed text-[15px]">
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
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
            }} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-3">
              Still have questions?
            </h3>
            <p className="text-slate-300 mb-8 text-lg">
              Our support team is here to help you get started with NEDA Pay
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <button className="w-full sm:w-auto group relative px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Contact Support
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}