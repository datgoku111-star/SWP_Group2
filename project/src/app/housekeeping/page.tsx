"use client";

import HousekeepingDashboardHub from "@/app/dashboard/housekeeping/page";
import DashboardLayout from "@/app/dashboard/layout";

export default function RootHousekeepingPage() {
  return (
    <DashboardLayout>
      <HousekeepingDashboardHub />
    </DashboardLayout>
  );
}
