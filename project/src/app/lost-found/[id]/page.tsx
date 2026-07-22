"use client";

import React, { use } from "react";
import Link from "next/link";
import { CustomerReportDetail } from "@/components/lost-found/CustomerReportDetail";

export default function CustomerReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link
            href="/lost-found"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            ← Quay lại trang Báo cáo đồ thất lạc
          </Link>
        </div>

        <CustomerReportDetail reportId={id} />
      </div>
    </div>
  );
}
