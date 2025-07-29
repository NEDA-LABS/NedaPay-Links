import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Repeat, BarChart2, Settings, Zap, ChevronRight } from "lucide-react";
import Image from "next/image";

const GlassCard = ({ children, className = "", isSelected = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg bg-white border overflow-hidden transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-2 border-blue-500 shadow-lg' 
          : 'border border-gray-200 hover:border-blue-400 hover:shadow-md'
      } ${className}`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm z-10"></div>
      )}
      {children}
    </div>
  );
};

const features = [
  {
    icon: Coins,
    title: "Stablecoins",
    description: "Accept multiple stablecoins, generate invoices and payment links",
    tags: ["TSHC", "cNGN"],
    accentColor: "#10367D",
    button: "Accept",
    route: "/stablecoins",
    visual:"/stablecoins.png"
  },
  {
    icon: Repeat,
    title: "Swap, Onramp, Offramp",
    description: "Low-fee conversions between assets",
    tags: ["0.1% fee", "Fast"],
    accentColor: "#A5CE00",
    button: "Swap",
    route: "/swap",
    visual:"/swaps_ramps.png"
  },
  {
    icon: BarChart2,
    title: "Analytics",
    description: "Real-time payment insights",
    tags: ["Reports", "Charts"],
    accentColor: "#10367D",
    button: "View",
    route: "/analytics",
    visual:"/analytics.png"
  },
  {
    icon: Settings,
    title: "Settlement",
    description: "Automated payment processing",
    tags: ["Auto", "Secure"],
    accentColor: "#A5CE00",
    button: "Setup",
    route: "/settlement",
    visual:"/settlement.png"
  },
];

export default function BrandedGlassUI() {
  const [selectedCard, setSelectedCard] = useState(1);
  const router = useRouter();

  const handleCardClick = (index: any) => {
    setSelectedCard(index);
  };

  const handleButtonClick = (route: any, e: any) => {
    e.stopPropagation();
    router.push(route);
  };

  return (
    <div className="min-h-screen bg-transparent p-6 flex items-center justify-center relative overflow-hidden mt-[-50px]">
      {/* Diagonal lines background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalLines" patternUnits="userSpaceOnUse" width="100" height="100">
              <path d="M0,0 L100,100 M0,25 L100,125 M0,50 L100,150 M0,75 L100,175 M-25,0 L75,100 M-50,0 L50,100 M-75,0 L25,100" 
                    stroke="teal" 
                    strokeWidth="5" 
                    fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines)" />
        </svg>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 border border-blue-700 rounded-full text-blue-700 font-medium backdrop-blur-sm mb-4">
            <span className="text-sm font-medium text-blue-700">POWERFUL FEATURES</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#3E55E6] mb-3">
          Everything You Need to Accept Stablecoin Payments
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">
          Streamline your stablecoin payments with intuitive, secure, and lightning-fast features
          </p>
        </div>

        {/* Features Grid - 2 per row on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isSelected = selectedCard === index;
            return (
              <GlassCard 
                key={index} 
                isSelected={isSelected}
                className="hover:bg-gray-50/50 min-h-[280px]  border-2 !border-[#3E55E6] !rounded-2xl shadow-2xl"
                onClick={() => handleCardClick(index)}
              >
                <div className="p-10 h-full flex flex-col justify-between space-y-8 relative z-10">
                  <div>
                    <div className="mb-4">
                      <Icon className="w-8 h-8 text-blue-600 mb-3" />
                    </div>
                    <h3 className="text-2xl font-semibold text-blue-600 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <Image src={feature.visual} alt={feature.title} width={300} height={100}/>
                  <div className="space-y-4">
                    {/* <div className="flex items-center gap-6 text-sm text-gray-500">
                      {feature.tags.map((tag, tagIndex) => (
                        <div key={tagIndex} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>{tag}</span>
                        </div>
                      ))}
                    </div> */}
                    
                    <button
                      onClick={(e) => handleButtonClick(feature.route, e)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
                    >
                      <span>{feature.button}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={() => router.push('/get-started')}
            className="px-8 py-4 text-base font-medium rounded-full flex items-center gap-3 mx-auto transition-all duration-300 hover:shadow-lg hover:scale-105"
            style={{
              backgroundColor: '#A5CE00',
              color: '#10367D',
            }}
          >
            Get Started
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

