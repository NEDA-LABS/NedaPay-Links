// app/(legal)/terms-of-service/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import Header from "@/components/Header";


export const metadata: Metadata = {
  title: "Terms of Service | NedaPay",
  description:
    "Read NedaPay's Terms of Service to understand your rights and obligations when using our digital payment platform.",
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 px-6 py-4">
        <Header />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
