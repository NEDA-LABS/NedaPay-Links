import { FileText, Link, DollarSign, Shuffle } from "lucide-react";

const actions = [
  {
    title: "Invoice",
    icon: FileText,
    onClick: () => alert("Generate Invoice clicked"),
  },
  {
    title: "Payment Link",
    icon: Link,
    onClick: () => alert("Create Payment Link clicked"),
  },
  {
    title: "Withdraw",
    icon: DollarSign,
    onClick: () => alert("Transfer to Fiat clicked"),
  },
  {
    title: "Swap",
    icon: Shuffle,
    onClick: () => alert("Cross-Chain Swap clicked"),
  },
];

export default function QuickActions() {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
          >
            <action.icon className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {action.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
