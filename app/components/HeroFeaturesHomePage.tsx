import { Globe2, Zap, Shield, CircleDollarSign, ArrowRight, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";

export default function HeroFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const features = [
    {
      icon: Globe2,
      title: "Global Stablecoins",
      description: "Access payments worldwide",
      gradient: "from-blue-500 to-indigo-500",
      hoverColor: "hover:border-blue-300",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Fast, reliable transactions",
      gradient: "from-blue-400 to-cyan-500",
      hoverColor: "hover:border-cyan-300",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Top-tier security",
      gradient: "from-indigo-500 to-purple-500",
      hoverColor: "hover:border-purple-300",
    },
    {
      icon: CircleDollarSign,
      title: "Zero Fees",
      description: "Cost-free transactions",
      gradient: "from-purple-500 to-blue-500",
      hoverColor: "hover:border-blue-300",
    },
  ];

  return (
    <div className="flex flex-col pb-4">
      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-3 mb-10">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={index}
              className={`
                group relative overflow-hidden
                bg-white/95 backdrop-blur-sm
                
                rounded-xl p-5 transition-all duration-300 ease-out
                shadow-md hover:shadow-xl hover:shadow-blue-500/10
                hover:-translate-y-1
                cursor-pointer ${feature.hoverColor}
              `}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Subtle background gradient on hover */}
              <div
                className={`
                  absolute inset-0 opacity-0 group-hover:opacity-10
                  bg-gradient-to-br ${feature.gradient} transition-opacity duration-300
                `}
              />
              
              {/* Icon and Content */}
              <div className="flex items-center gap-4">
                <div
                  className={`
                    inline-flex items-center justify-center w-10 h-10
                    rounded-lg bg-gradient-to-br ${feature.gradient}
                    shadow-md group-hover:shadow-lg transition-all duration-300
                    ${isHovered ? "scale-110" : "scale-100"}
                  `}
                >
                  <Icon
                    className="w-5 h-5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="relative z-10">
                  <h3 className="font-semibold text-lg text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700">
                    {feature.description}
                  </p>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div
                className={`
                  absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full
                  bg-gradient-to-r ${feature.gradient} transition-all duration-300
                `}
              />
            </div>
          );
        })}
      </div>

      {/* Professional CTA Buttons */}
      <div className="flex flex-row gap-10 justify-between items-end">
        <button className="group inline-flex items-center !px-8 !py-4 !bg-gradient-to-r from-blue-600 to-indigo-600 hover:!from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 transform">
          <CreditCard className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
          Generate Payment Link
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
        
        <button className="group inline-flex items-center !px-8 !py-4 !bg-white hover:!bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 transform">
          <Banknote className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
          Cash Out Options
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}