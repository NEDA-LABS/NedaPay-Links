import { Globe2, Zap, Shield, CircleDollarSign, ArrowRight, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";
import HeroFlags from "./HeroFlags";

export default function HeroFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const features = [
    {
      icon: Globe2,
      title: "Global Stablecoins",
      description: "Access payments worldwide",
      gradient: "from-blue-500 to-indigo-500",
      iconBg: "bg-blue-500/10",
      hoverIconBg: "group-hover:bg-blue-500/20",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Fast, reliable transactions",
      gradient: "from-blue-400 to-cyan-500",
      iconBg: "bg-cyan-500/10",
      hoverIconBg: "group-hover:bg-cyan-500/20",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Top-tier security",
      gradient: "from-indigo-500 to-purple-500",
      iconBg: "bg-purple-500/10",
      hoverIconBg: "group-hover:bg-purple-500/20",
    },
    {
      icon: CircleDollarSign,
      title: "Zero Fees",
      description: "Cost-free transactions",
      gradient: "from-purple-500 to-blue-500",
      iconBg: "bg-blue-500/10",
      hoverIconBg: "group-hover:bg-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-end mx-auto pl-4">
      {/* Features arranged in clean rows */}
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isHovered = hoveredIndex === index;
        return (
          <div
            key={index}
            className="group flex items-center space-x-4 cursor-pointer transition-all duration-300 hover:translate-x-2"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Icon */}
            <div
              className={`
                flex items-center justify-center w-14 h-14 rounded-2xl
                ${feature.iconBg} ${feature.hoverIconBg}
                transition-all duration-300 group-hover:scale-110
                ${isHovered ? 'shadow-lg' : ''}
              `}
            >
              <Icon
                className={`w-7 h-7 text-blue-600 transition-all duration-300`}
                strokeWidth={2}
              />
            </div>

            {/* Content */}
            <div className="">
              <h3 className="!text-l sm:!text-l font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-300 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-xl text-slate-600 group-hover:text-slate-700 transition-colors duration-300 leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Subtle arrow indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </div>
          </div>
        );
      })}
    </div>
  );
}