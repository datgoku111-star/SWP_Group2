"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading reports...</div>;

  const handleExport = () => {
    // Mock export to CSV
    alert("Exporting report to CSV...");
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Reports</h1>
          <p className="text-neutral-500 mt-1">Analytics and operational metrics</p>
        </div>
        <ButtonPrimary onClick={handleExport}>
          <Download className="w-5 h-5 mr-2" /> Export Report
        </ButtonPrimary>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-8 rounded-2xl">
        <h3 className="text-xl font-bold mb-6">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Total Rooms</p>
            <p className="text-2xl font-bold">{stats.total_rooms}</p>
          </div>
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Occupancy Rate</p>
            <p className="text-2xl font-bold">{stats.occupancy_rate}%</p>
          </div>
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Today's Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.revenue_today)}
            </p>
          </div>
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Pending Orders</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending_orders}</p>
          </div>
        </div>
      </div>

      {/* Placeholder for charts/graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-8 rounded-2xl h-80 flex items-center justify-center text-neutral-500">
          Revenue Chart Placeholder
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-8 rounded-2xl h-80 flex items-center justify-center text-neutral-500">
          Occupancy Trend Placeholder
        </div>
      </div>
    </div>
  );
}
