"use client";
import { FileText, Link, DollarSign, BarChart3, ChevronDown, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QuickActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const actions = [
    {
      title: "Invoice",
      icon: FileText,
      onClick: () => router.push("/invoice"),
      description: "Create new invoice"
    },
    {
      title: "Request",
      icon: Link,
      onClick: () => router.push("/payment-link"),
      description: "Generate payment link"
    },
    {
      title: "Withdraw",
      icon: DollarSign,
      onClick: () => router.push("/ramps"),
      description: "Cash out funds"
    },
    {
      title: "Analytics",
      icon: BarChart3,
      onClick: () => router.push("/analytics"),
      description: "View reports"
    },
  ];

  return (
    <div className="flex items-center justify-center mb-6 px-4 relative z-50">
      {/* Desktop View */}
      <div className="hidden md:flex items-center bg-slate-800/80 backdrop-blur-sm rounded-full p-1.5 border border-slate-700/50 shadow-lg">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 whitespace-nowrap"
          >
            <action.icon className="w-4 h-4" />
            <span>{action.title}</span>
          </button>
        ))}
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-slate-800/80 backdrop-blur-sm border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full px-4 py-2.5 shadow-lg"
            >
              {/* <Menu className="w-4 h-4 mr-2" /> */}
              <span className="text-sm font-medium">Quick Actions</span>
              <ChevronDown className="w-4 h-4 ml-2 transition-transform duration-200" style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-xl"
            align="center"
            sideOffset={8}
          >
            {actions.map((action, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={action.onClick}
                className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 cursor-pointer transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{action.title}</span>
                  <span className="text-xs text-slate-400">{action.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}