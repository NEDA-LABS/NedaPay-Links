"use client";

import { AppSidebar } from "./AppSidebar";
import DashboardContent from "./MainContent";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";


export default function Dashboard() {
  return (
    <div className="flex flex-col">
      <div className="">
        <SidebarProvider>
          <div className="flex bg-beige h-screen">
            <div className="fixed left-0 w-64 overflow-y-auto h-screen">
              <AppSidebar />
            </div>
            <div className="md:pl-64 flex-1">
              <DashboardContent />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
