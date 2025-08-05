
"use client";

import DashboardLayout from "@/dashboard/layout";

export function withDashboardLayout(PageComponent: React.ComponentType) {
  return function WrappedPage(props: any) {
    return (
      <DashboardLayout>
        <PageComponent {...props} />
      </DashboardLayout>
    );
  };
}