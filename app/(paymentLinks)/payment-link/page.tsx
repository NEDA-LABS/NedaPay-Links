"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PaymentLinkForm } from "./components/PaymentLinkForm";
import { withDashboardLayout } from "@/utils/withDashboardLayout";

function PaymentLinkPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    document.cookie = "wallet_connected=true; path=/; max-age=86400";
  }, []);

  return (
    <div className="min-h-screen mx-auto">
      <Header />
      {isClient && <PaymentLinkForm />}
      <Footer />
    </div>
  );
}

export default withDashboardLayout(PaymentLinkPage);