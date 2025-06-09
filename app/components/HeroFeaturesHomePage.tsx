import { Globe, Zap, Shield, DollarSign } from "lucide-react";
import { useState } from "react";

export default function HeroFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features = [
    {
      icon: Globe,
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
      icon: DollarSign,
      title: "Zero Fees",
      description: "Cost-free transactions",
      gradient: "from-purple-500 to-blue-500",
      hoverColor: "hover:border-blue-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 my-10">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={index}
            className={`
              group relative overflow-hidden
              bg-white/95 backdrop-blur-sm
              border border-slate-200
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

            {/* Icon container */}
            <div className="relative mb-4">
              <div
                className={`
                  inline-flex items-center justify-center w-12 h-12
                  rounded-lg bg-gradient-to-br ${feature.gradient}
                  shadow-md group-hover:shadow-lg transition-all duration-300
                  ${isHovered ? "scale-110" : "scale-100"}
                `}
              >
                <Icon
                  className="w-6 h-6 text-white"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="font-semibold text-lg mb-1 text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 group-hover:text-slate-700">
                {feature.description}
              </p>
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
  );
}