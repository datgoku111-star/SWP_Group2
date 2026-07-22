"use client";

import React, { useState } from "react";
import { AdminLostFoundDashboard } from "@/components/lost-found/AdminLostFoundDashboard";

export default function LostFoundPage() {
  const [activeTab, setActiveTab] = useState<"CUSTOMER_REPORTS">("CUSTOMER_REPORTS");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        <button
          onClick={() => setActiveTab("CUSTOMER_REPORTS")}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === "CUSTOMER_REPORTS"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🔍 QL Báo Cáo Đồ Thất Lạc Từ Khách Hàng (Quy Trình 9 Trạng Thái)
        </button>
      </div>

      <AdminLostFoundDashboard />
    </div>
  );
}