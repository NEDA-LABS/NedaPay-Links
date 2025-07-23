'use client';

import { AppSidebar } from './AppSidebar';
import DashboardContent from './MainContent';
import { SidebarProvider } from './sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Dashboard() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header/>
      <div className=''>
        <SidebarProvider>
          <div className="flex bg-beige h-screen">
            <div className="w-64 bg-dark-sidebar">
              <AppSidebar />
            </div>
            <div className="flex-1 overflow-y-auto">
              <DashboardContent />
            </div>
          </div>
        </SidebarProvider>
      </div>
      <Footer/>
    </div>
  );
}