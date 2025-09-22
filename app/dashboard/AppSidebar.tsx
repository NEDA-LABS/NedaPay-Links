"use client";

import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Settings,
  Building2,
  Bell,
  Shield,
  Code,
  HelpCircle,
  Search,
  Send,
  Activity,
  Sparkles,
  ChevronLeft,
  Menu, // This is the icon we'll use for the toggle
  BarChart3,
  FileIcon,
  ArrowRightLeft,
  Home,
  IdCard,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from "@/compliance/user/components/ui/sidebar";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import useSumsub from "@/hooks/useSumsub";

function NedaPayLogo() {
  return (
    <div className="p-4 flex items-center justify-center">
      <Image src="/logo.svg" alt="Logo" width={100} height={100} />
    </div>
  );
}

function AppSidebarContent() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const { getAccessToken } = usePrivy();
  const [businessName, setBusinessName] = useState("@user");

  const { kycStatus, loading, error: sumsubError } = useSumsub();

  const allItems = [
    { title: "Home", url: "/dashboard", icon: Home },
    { title: "Payment Link", url: "/payment-link", icon: Send },
    { title: "Generate Invoice", url: "/invoice", icon: FileIcon },
    { title: "Withdraw", url: "/ramps", icon: CreditCard },
    { title: "Bridge", url: "/accross-bridge", icon: ArrowRightLeft },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    {
      title: "Transactions",
      url: "/all-transactions",
      icon: FileText,
    },
    { title: "Notifications", url: "/all-notifications", icon: Bell },
    { title: "Profile", url: "/settings", icon: User },
    { title: "Developers", url: "/developers", icon: Code },
    { title: "Support", url: "/support", icon: HelpCircle },
  ];

  const getNavClass = (url: string) => {
    const isActive =
      pathname === url ||
      (url === "/" && pathname === "/") ||
      (url !== "/" && pathname.startsWith(url));

    return isActive
      ? "font-bold text-white"
      : "text-white/80 hover:text-white";
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const accessToken = await getAccessToken();
    const response = await fetch("/api/settings", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    const settings = data.settings;
    setBusinessName(settings.businessName || "@user");
  };

  return (
    <Sidebar
      className={
        isCollapsed
          ? "w-20 !bg-gray-900 text-white shadow-lg"
          : "w-64 !bg-gray-900 text-white shadow-lg"
      }
    >
      <SidebarContent className="flex flex-col h-full">
        <div className="flex items-center justify-between">
          {!isCollapsed && <NedaPayLogo />}
          <button
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10 rounded-md p-2"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={`h-6 w-6 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarMenu>
            {allItems.map((item) => (
              <SidebarMenuItem key={item.title} className=" md:my-2">
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={`flex items-center space-x-3 md:space-x-4 p-2 md:p-3 rounded-full transition-colors text-base md:text-xl ${getNavClass(
                      item.url
                    )}`}
                  >
                    <item.icon className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <div className="p-4 border-t border-white/20 mt-auto">
          <Link href="/settings">
            {!isCollapsed && (
              <div className="flex items-center space-x-3 hover:bg-white/10 p-2 rounded-lg cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{businessName}</p>
                  <p className="text-sm text-white/60">View Profile</p>
                </div>
              </div>
            )}
          </Link>
          {/* {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{businessName}</p>
                <p className="text-sm text-white/60">View Profile</p>
              </div>
            </div>
          )} */}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppSidebar() {
  return <AppSidebarContent />;
}

// New standalone toggle component
export function AppSidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="text-white hover:bg-white/10 rounded-md p-1"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
