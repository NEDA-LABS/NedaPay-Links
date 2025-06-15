import React from "react";
import {
  Coins,
  Repeat,
  BarChart2,
  Settings,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { useRef } from "react";
import WalletSelector from "./WalletSelector";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function EnhancedFeaturesSection() {
  const walletSelectorRef = useRef<{ triggerLogin: () => void } | null>(null);
  const { authenticated } = usePrivy();
  const router = useRouter();

  const features = [
    {
      icon: Coins,
      title: "Accept Local Stablecoins",
      description:
        "Accept TSHC, cNGN, IDRX, and USDC with seamless integration across all supported networks.",
      tags: ["TSHC", "cNGN", "IDRX", "USDC"],
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-500/20 to-indigo-600/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600",
      glowColor: "bg-blue-400/20",
      button: "Start Accepting",
      buttonGradient: "from-blue-600 to-indigo-600",
    },
    {
      icon: Repeat,
      title: "Instant Stablecoin Swaps",
      description:
        "Swap between any supported stablecoins in seconds with our built-in DEX integration.",
      tags: ["Instant", "Low Fees"],
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-500/20 to-purple-600/20",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      glowColor: "bg-indigo-400/20",
      button: "Start Swapping",
      buttonGradient: "from-indigo-600 to-purple-600",
    },
    {
      icon: BarChart2,
      title: "Real-Time Analytics",
      description:
        "Track your payment performance with detailed insights, conversion rates, and revenue analytics.",
      tags: ["Insights", "Reports"],
      gradient: "from-green-500 to-teal-600",
      bgGradient: "from-green-500/20 to-teal-600/20",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      glowColor: "bg-green-400/20",
      button: "Start Analyzing",
      buttonGradient: "from-green-600 to-teal-600",
    },
    {
      icon: Settings,
      title: "Smart Settlement",
      description:
        "Automatically settle payments with customizable rules, schedules, and multi-currency support.",
      tags: ["Automated", "Flexible"],
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-500/20 to-pink-600/20",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      glowColor: "bg-purple-400/20",
      button: "Start Settling",
      buttonGradient: "from-purple-600 to-pink-600",
    },
  ];

  const handleCTAClick = () => {
    if (!authenticated && walletSelectorRef.current) {
      walletSelectorRef.current.triggerLogin();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="mb-24 scroll-mt-20 p-6 sm:p-8 bg-white/20 rounded-2xl border border-blue-100 shadow-lg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -left-16 top-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
      <div className="absolute -right-16 top-2/3 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-24 bottom-1/4 w-48 h-48 bg-purple-400/5 rounded-full blur-3xl"></div>
      <div className="absolute -right-24 top-1/4 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl"></div>

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100/80 to-indigo-100/80 text-blue-700 text-sm font-medium mb-4 border border-blue-200">
            <Zap className="mr-2 h-4 w-4" />
            <span>Powerful Features</span>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Everything You Need to Accept Crypto Payments
          </h2>

          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto text-xs">
            Streamline your stablecoin payments with intuitive, secure, and
            lightning-fast features
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="relative group">
              <div className="bg-white rounded-2xl justify-center items-center p-6 shadow-xl border border-blue-100 flex flex-col h-full hover:shadow-2xl transition-all duration-300 hover:border-blue-300 hover:-translate-y-1">
                {/* Glow effect */}
                <div
                  className={`absolute -inset-0.5 ${feature.glowColor} rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 `}
                ></div>

                {/* Content */}
                <div className="relative flex flex-col flex-grow">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-all duration-300`}
                  >
                    <feature.icon
                      className="h-8 w-8 text-white"
                      strokeWidth={2}
                    />
                    <div
                      className={`absolute inset-0 rounded-2xl ${feature.glowColor} blur-sm opacity-50 group-hover:opacity-70 transition-opacity`}
                    ></div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 text-xs leading-relaxed flex-grow">
                    {feature.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {feature.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {/* <div className="mt-auto">
                    <button
                      onClick={handleCTAClick}
                      className={`inline-flex items-center px-4 py-2 !rounded-full !bg-gradient-to-r ${feature.buttonGradient} !text-white !text-sm !font-medium !shadow-md !hover:shadow-lg transition-all duration-300 hover:scale-105 w-full justify-center`}
                    >
                      <Shield className="mr-1 h-4 w-4" />
                      {feature.button}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div> */}
                </div>

                {/* Bottom gradient line */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl`}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA section */}
        {!authenticated ? (
          <div className="mt-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  if (walletSelectorRef.current) {
                    walletSelectorRef.current.triggerLogin();
                  }
                }}
                className="inline-flex items-center px-6 py-3 !rounded-full !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white !font-semibold !shadow-lg !hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <Shield className="mr-2 h-5 w-5" />
                <span className="text-xs">Start accepting payments today</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <span hidden={true}>
                <WalletSelector ref={walletSelectorRef} />
              </span>
            </div>

            <p className="pt-4 text-xs !font-extrabold text-emerald-600 flex items-center justify-center animate-bounce">
              <Clock className="mr-2 h-6 w-6 text-emerald-500" />
              Setup takes only 60 seconds! ⚡
            </p>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center px-6 py-3 !rounded-full !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white !font-semibold !shadow-lg !hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <Shield className="mr-2 h-5 w-5" />
                <span>Start accepting payments today</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
