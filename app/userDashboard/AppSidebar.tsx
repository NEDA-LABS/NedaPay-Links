'use client';

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
  Menu,
  BarChart3,
  FileIcon
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
  useSidebar
} from "./sidebar";

const overviewItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Notification Center", url: "/all-notifications", icon: Bell },
];

const productItems = [
  { title: "Payment Link", url: "/payment-link", icon: Send },
  {title: "Generate Invoice", url: "/invoice", icon: FileIcon},
  { title: "Swap Coins", url: "/swap-coins", icon: Activity },
  { title: "Transfer to Fiat", url: "/offramp", icon: CreditCard },
  { title: "Customize Dashboard", url: "/settings", icon: Sparkles },
  {title: "Analytics", url: "/analytics", icon: BarChart3}
];

const paymentItems = [
  { title: "Transactions", url: "/all-transactions", icon: FileText },
  // { title: "Dispute and Settlement", url: "/disputes", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];


const resourceItems = [
  // { title: "API - Integration", url: "/api", icon: Code },
  { title: "Support", url: "/support", icon: HelpCircle },
];

function AppSidebarContent() {
  const { state, toggle } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const pathname = usePathname();

  const getNavClass = (url: string) => {
    const isActive = pathname === url || 
                    (url === '/' && pathname === '/') || 
                    (url !== '/' && pathname.startsWith(url));
    
    return isActive 
      ? "bg-white/20 text-white hover:bg-white/25" 
      : "text-white/80 hover:bg-white/10 hover:text-white";
  };

  return (
    <Sidebar className="bg-[#3E55E6] text-white shadow-lg">
      <SidebarContent className="sidebar-content sidebar-transition">
        {/* Mobile menu button */}
        <div className="md:hidden p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
            <span className="font-semibold text-white">Business Name</span>
          </div>
          <button 
            onClick={toggle}
            className="text-white hover:bg-white/10 rounded-md p-1"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        {/* Desktop search and toggle */}
        <div className="hidden md:block p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
              {!isCollapsed && <span className="font-semibold text-white">Business Name</span>}
            </div>
            <button 
              onClick={toggle}
              className="text-white hover:bg-white/10 rounded-md p-1"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {!isCollapsed && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <input 
                placeholder="Search..." 
                className="w-full pl-10 pr-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          )}
        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          {/* Overview */}
          <SidebarGroup>
            {/* {!isCollapsed && (
              <SidebarGroupLabel>OVERVIEW</SidebarGroupLabel>
            )} */}
            <SidebarGroupContent>
              <SidebarMenu>
                {overviewItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={item.url}
                        className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'} rounded-md transition-colors ${getNavClass(item.url)}`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Product */}
          <SidebarGroup>
            {/* {!isCollapsed && (
              <SidebarGroupLabel>PRODUCT</SidebarGroupLabel>
            )} */}
            <SidebarGroupContent>
              <SidebarMenu>
                {productItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={item.url}
                        className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'} rounded-md transition-colors ${getNavClass(item.url)}`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Payments */}
          <SidebarGroup>
            {/* {!isCollapsed && (
              <SidebarGroupLabel>PAYMENTS</SidebarGroupLabel>
            )} */}
            <SidebarGroupContent>
              <SidebarMenu>
                {paymentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={item.url}
                        className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'} rounded-md transition-colors ${getNavClass(item.url)}`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Resources */}
          <SidebarGroup>
            {/* {!isCollapsed && (
              <SidebarGroupLabel>RESOURCES</SidebarGroupLabel>
            )} */}
            <SidebarGroupContent>
              <SidebarMenu>
                {resourceItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={item.url}
                        className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'} rounded-md transition-colors ${getNavClass(item.url)}`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppSidebar() {
  return (
    <SidebarProvider>
      <AppSidebarContent />
    </SidebarProvider>
  );
}