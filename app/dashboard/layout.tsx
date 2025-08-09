// app/(dashboard)/layout.tsx
"use client";

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSidebar } from "@/compliance/user/components/ui/sidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 w-full">
      <div className="flex w-full">
        <div className="overflow-y-auto h-screen">
          <AppSidebar />
        </div>
        {(() => {
          const { state, toggleSidebar } = useSidebar();
          console.log(state);
          return (
            <div className={`${state === "collapsed" ? "md:ml-14" : "md:ml-64"} overflow-y-auto h-screen px-2 w-full mx-auto`}>
              {children}
            </div>
          );
        })()}
      </div>
      {/* <div className='fixed bottom-0 w-full'>
        </div> */}
    </div>
  );
}