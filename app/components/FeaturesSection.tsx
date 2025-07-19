import { useRef, useState } from "react";
import { Coins, Repeat, BarChart2, Settings } from "lucide-react";

const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(59, 130, 246, 0.05)" }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  
  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };
  
  const handleMouseEnter = () => {
    setOpacity(1);
  };
  
  const handleMouseLeave = () => {
    setOpacity(0);
  };
  
  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl border border-gray-200 bg-white overflow-hidden p-8 shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:border-gray-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
};

const features = [
  {
    icon: Coins,
    title: "Accept Local Stablecoins",
    description: "Accept TSHC, cNGN, IDRX, and USDC with seamless integration across all supported networks.",
    tags: ["TSHC", "cNGN", "IDRX", "USDC"],
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    button: "Start Accepting",
    spotlightColor: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: Repeat,
    title: "Instant Stablecoin Swaps",
    description: "Swap between any supported stablecoins in seconds with our built-in DEX integration.",
    tags: ["Instant", "Low Fees"],
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    button: "Start Swapping",
    spotlightColor: "rgba(99, 102, 241, 0.08)",
  },
  {
    icon: BarChart2,
    title: "Real-Time Analytics",
    description: "Track your payment performance with detailed insights, conversion rates, and revenue analytics.",
    tags: ["Insights", "Reports"],
    gradient: "bg-gradient-to-br from-green-500 to-teal-600",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    button: "Start Analyzing",
    spotlightColor: "rgba(34, 197, 94, 0.08)",
  },
  {
    icon: Settings,
    title: "Smart Settlement",
    description: "Automatically settle payments with customizable rules, schedules, and multi-currency support.",
    tags: ["Automated", "Flexible"],
    gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    button: "Start Settling",
    spotlightColor: "rgba(147, 51, 234, 0.08)",
  },
];

export default function SpotlightFeatures() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-6 text-sm font-medium text-blue-600 bg-blue-50 rounded-full border border-blue-200">
            ✨ Platform Features
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to accept, swap, and manage stablecoins with enterprise-grade security and performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <SpotlightCard 
                key={index} 
                className="group cursor-pointer transform hover:scale-[1.02] transition-transform duration-300"
                spotlightColor={feature.spotlightColor}
              >
                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`${feature.iconBg} ${feature.iconColor} p-3 rounded-xl border border-gray-100 shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {feature.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-gray-50 text-gray-700 text-xs sm:text-sm rounded-full border border-gray-200 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    <button
                      className={`w-full ${feature.gradient} text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      {feature.button}
                    </button>
                  </div>
                </div>
                
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"></div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to transform your payment infrastructure?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using our platform to streamline their stablecoin operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Get Started Today
              </button>
              <button className="border-2 border-gray-300 text-gray-700 font-semibold py-4 px-8 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}