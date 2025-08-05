// app/(dashboard)/layout.tsx
"use client";

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-100 w-full">
        <div className="flex w-full">
          <div className="fixed left-0 w-64 overflow-y-auto h-screen">
            <AppSidebar />
          </div>
          <div className="md:pl-64 flex-1 w-full">
            {children}
          </div>
        </div>
        {/* <div className='fixed bottom-0 w-full'>
        </div> */}
      </div>
    </SidebarProvider>
  );
}