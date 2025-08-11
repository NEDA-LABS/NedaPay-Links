"use client";

import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";
import { useSidebar } from "@/compliance/user/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  
  return (
    <SidebarProvider>
      <div className="flex w-full">
        <div className="overflow-y-auto h-screen">
          <AppSidebar />
        </div>
        <div className={`${state === "collapsed" ? "md:ml-14" : "md:ml-64"} overflow-y-auto h-screen px-2 w-full mx-auto`}>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
