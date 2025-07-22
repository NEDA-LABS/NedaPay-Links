import React from "react";
import {
  Wallet,
  Link,
  DollarSign,
  Repeat2,
  CheckCircle,
  ArrowRight,
  Globe,
  Smartphone,
  Shield,
  Banknote,
  ArrowDown,
} from "lucide-react";
import { useRef } from "react";
import WalletSelector from "./WalletSelector";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import RippleGrid from "./RippleGrid";
import Image from "next/image";

export default function HowItWorksSection() {
  const walletSelectorRef = useRef<{ triggerLogin: () => void } | null>(null);
  const { authenticated } = usePrivy();
  const router = useRouter();

  const handleCTAClick = () => {
    if (!authenticated && walletSelectorRef.current) {
      walletSelectorRef.current.triggerLogin();
    } else {
      router.push("/dashboard");
    }
  };

  const steps = [
    {
      number: "01",
      icon: Wallet,
      title: "Sign in with Email or Wallet",
      description:
        "Connect your Base wallet to access the merchant dashboard and all features",
      details: "Supports MetaMask, Coinbase Wallet, and other Web3 wallets",
      color: "blue",
      gradient: "from-blue-400 to-cyan-400",
      bgColor: "bg-blue-25",
      iconBg: "bg-blue-500",
      tags: ["MetaMask", "Coinbase"],
      button: "Connect Wallet",
      buttonGradient: "from-blue-600 to-cyan-600",
      visual: "/signup.jpg"
    },
    {
      number: "02",
      icon: Banknote,
      title: "Complete KYC/KYB",
      description:
        "Verify your identity to access all features and ensure secure transactions",
      details: "Compliance with regulations and standards",
      color: "orange",
      gradient: "from-blue-400 to-blue-400",
      bgColor: "bg-blue-25",
      iconBg: "bg-blue-500",
      tags: ["KYC", "KYB"],
      button: "Verify",
      buttonGradient: "from-blue-600 to-blue-600",
      visual: "/kyc.jpg"
    },
    {
      number: "03",
      icon: Link,
      title: "Create Payment Links",
      description:
        "Generate payment links or QR codes to share with your customers",
      details: "Instant generation with customizable amounts and descriptions",
      color: "indigo",
      gradient: "from-blue-400 to-blue-400",
      bgColor: "bg-indigo-25",
      iconBg: "bg-indigo-500",
      tags: ["QR Codes", "Custom Links"],
      button: "Create Payment Link",
      buttonGradient: "from-blue-600 to-cyan-600",
      visual: "/link.jpg"
    },
    {
      number: "04",
      icon: DollarSign,
      title: "Receive Payments",
      description:
        "Customers pay using any wallet / fund from bank account and receive stablecoins payments instantly that you can withdraw to bank",
      details: "Real-time notifications and automatic balance updates",
      color: "green",
      gradient: "from-blue-400 to-blue-400",
      bgColor: "bg-green-25",
      iconBg: "bg-green-500",
      tags: ["Instant", "Secure"],
      button: "Receive Payments",
      buttonGradient: "from-blue-600 to-blue-600",
      visual: "/receive_payment.jpg"
    },
    {
      number: "05",
      icon: Repeat2,
      title: "Swap Stablecoins",
      description:
        "Instantly swap between TSHC, cNGN, IDRX, USDC, and more—no third-party required",
      details: "Built-in DEX integration with competitive rates",
      color: "purple",
      gradient: "from-blue-400 to-blue-400",
      bgColor: "bg-purple-25",
      iconBg: "bg-purple-500",
      tags: ["DEX", "Low Fees"],
      button: "Swap Stablecoins",
      buttonGradient: "from-blue-600 to-blue-600",
      visual: "/swap.jpg"
    },
    {
      number: "06",
      icon: Banknote,
      title: "Transfer Tokens",
      description:
        "Withdraw your stablecoins to your bank account, mobile network, exchange or external wallet",
      details: "Fast and secure withdrawal process",
      color: "orange",
      gradient: "from-blue-400 to-blue-400",
      bgColor: "bg-blue-25",
      iconBg: "bg-blue-500",
      tags: ["Bank", "Mobile"],
      button: "Withdraw",
      buttonGradient: "from-blue-600 to-blue-600",
      visual: "/offramp.jpg"
    },
    
  ];

  return (
    <div id="how-it-works" className="relative" style={{
      backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 74, 109, 0.2) 10%, rgba(0, 74, 109, 0.4) 30%, rgba(0, 74, 109, 0.4) 70%, rgba(0, 74, 109, 0.35) 75%, rgba(0, 74, 109, 0.3) 80%, rgba(0, 74, 109, 0.2) 90%, rgba(0, 74, 109, 0.1) 95%,transparent 100%)'
    }}>
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-200/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 sm:w-32 sm:h-32 bg-purple-200/30 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 bg-indigo-200/20 rounded-full blur-3xl"></div>

      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-600 text-sm font-medium mb-4 sm:mb-6">
            <Smartphone className="mr-2 h-4 w-4" />
            <span>Simple Process</span>
          </div>

          <h2 className="text-2xl text-blue-700 sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            How It Works
          </h2>

          <p className="text-xs sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Get started with NEDA Pay in just four simple steps. No complex
            setup, no lengthy onboarding.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connection Line - Hidden on mobile, visible on desktop */}
          <div className="hidden xl:block absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 via-green-300 to-purple-300 opacity-40"></div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group h-full">
                {/* Step Card with equal heights */}
                <div
                  className={`h-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col`}
                >
                  {/* Content - Flex grow to fill available space */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2 sm:mb-3">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#3E55E6] flex items-center justify-center shadow-md hover:scale-105 transition-transform duration-300`}
                      >
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {step.number}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors">
                        {step.title}
                      </h3>
                    </div>
                    {/* <div className="opacity-20 hover:opacity-30 transition-opacity">
                      <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div> */}
                    {/* <p className="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-xs">
                      {step.description}
                    </p> */}
                    <p className="text-xs text-gray-500 italic">
                      {step.details}
                    </p>
                  </div>

                  {/* Visual Element */}
                  <div className="flex justify-center">
                    <Image
                      src={step.visual}
                      alt={step.title}
                      width={130}
                      height={130}
                      className="w-auto h-auto max-w-full"
                    />
                  </div>

                  {/* Tags */}
                  {/* <div className="flex flex-wrap gap-2 mt-auto">
                    {step.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 text-gray-600"
                      >
                        <div
                          className={`w-2 h-2 bg-gradient-to-r ${step.gradient} rounded-full mr-1 sm:mr-2`}
                        ></div>
                        {tag}
                      </span>
                    ))}
                  </div> */}

                  {/* Button */}
                  <div className="flex mt-1 z-10">
                    <button
                      onClick={handleCTAClick}
                      className={`inline-flex text-xs items-center px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl !bg-[#3E55E6] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
                    >
                      <span className="text-sm">{step.button}</span>
                      <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* Subtle Hover Effect */}
                  <div
                    className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 hover:opacity-3 transition-opacity duration-300`}
                  ></div>
                </div>

                {/* Arrow Connector (Desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden xl:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {/* <div className="text-center mt-12 sm:mt-16">
          <div className="text-sm inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            {!authenticated ? (
              <div className="text-center">
                <div className="">
                  <button
                    onClick={() => {
                      if (walletSelectorRef.current) {
                        walletSelectorRef.current.triggerLogin();
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 !rounded-full !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white !font-semibold !shadow-lg !hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    <span className="text-xs">Ready to get Started?</span>
                  </button>
                  <span hidden={true}>
                    <WalletSelector ref={walletSelectorRef} />
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center px-6 py-3 !rounded-full !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white !font-semibold !shadow-lg !hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    <span>Ready to get Started?</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 sm:mt-4 text-slate-500 text-sm sm:text-base">
            Join thousands of merchants already using NEDA Pay
          </p>
        </div> */}
      </div>
    </div>
  );
}
