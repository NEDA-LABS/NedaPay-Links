"use client";

import { AppSidebar } from "./AppSidebar";
import DashboardContent from "./MainContent";
import { SidebarProvider } from "./sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Dashboard() {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="">
        <SidebarProvider>
          <div className="flex bg-beige h-screen">
            <div className="fixed left-0 w-64 bg-dark-sidebar">
              <AppSidebar />
            </div>
            <div className="pl-64 flex-1">
              <DashboardContent />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
