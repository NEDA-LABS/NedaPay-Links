import { FileText, Link, DollarSign, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();
  
  const actions = [
    {
      title: "Invoice",
      description: "Create & send invoices",
      icon: FileText,
      onClick: () => router.push("/invoice"),
      color: "blue",
    },
    {
      title: "Request",
      description: "Generate payment links",
      icon: Link,
      onClick: () => router.push("/payment-link"),
      color: "green",
    },
    {
      title: "Withdraw",
      description: "Transfer to bank",
      icon: DollarSign,
      onClick: () => router.push("/ramps"),
      color: "purple",
    },
    {
      title: "Analytics",
      description: "View insights & stats",
      icon: BarChart3,
      onClick: () => router.push("/analytics"),
      color: "orange",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "text-blue-400 group-hover:text-blue-300",
      green: "text-emerald-400 group-hover:text-emerald-300",
      purple: "text-purple-400 group-hover:text-purple-300",
      orange: "text-amber-400 group-hover:text-amber-300",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="group relative flex flex-row items-center p-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]"
          >
            {/* Icon container */}
            <div className="flex items-center justify-center w-10 h-10 group-hover:bg-gray-700/70 transition-colors duration-300">
              <action.icon className={`w-5 h-5 transition-colors duration-300 ${getColorClasses(action.color)}`} />
            </div>
            
            {/* Text content */}
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-100 group-hover:text-white transition-colors duration-300">
                {action.title}
              </h3>
              {/* <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 mt-1">
                {action.description}
              </p> */}
            </div>
            
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
}