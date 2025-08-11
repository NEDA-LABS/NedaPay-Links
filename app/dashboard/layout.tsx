import { ClientWrapper } from "./client-wrapper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 w-full">
      <ClientWrapper>
        {children}
      </ClientWrapper>
    </div>
  );
}