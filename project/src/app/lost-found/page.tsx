"use client";

import React, { useState } from "react";
import { CustomerLostFoundForm } from "@/components/lost-found/CustomerLostFoundForm";
import { CustomerReportsList } from "@/components/lost-found/CustomerReportsList";
import { CustomerReportDetail } from "@/components/lost-found/CustomerReportDetail";

export default function CustomerLostFoundPage() {
  const [activeTab, setActiveTab] = useState<"MY_REPORTS" | "CREATE_REPORT">("MY_REPORTS");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Trung Tâm Khai Báo & Quản Lý Đồ Thất Lạc
          </h1>
          <p className="text-primary-100 text-sm max-w-2xl">
            Nếu quý khách lỡ quên tài sản, đồ dùng cá nhân tại phòng hoặc khuôn viên khách sạn, hãy gửi khai báo để đội ngũ Lễ tân & Security hỗ trợ tìm kiếm nhanh nhất.
          </p>
        </div>

        {/* Tab Navigation nếu không chọn xem chi tiết */}
        {!selectedReportId && (
          <div className="flex border-b border-gray-200 dark:border-gray-700 gap-8">
            <button
              onClick={() => setActiveTab("MY_REPORTS")}
              className={`pb-4 text-sm font-bold border-b-2 transition ${
                activeTab === "MY_REPORTS"
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              📋 Danh Sách Báo Cáo Của Tôi
            </button>
            <button
              onClick={() => setActiveTab("CREATE_REPORT")}
              className={`pb-4 text-sm font-bold border-b-2 transition ${
                activeTab === "CREATE_REPORT"
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              ➕ Gửi Báo Khai Báo Mới
            </button>
          </div>
        )}

        {/* Nội dung tương ứng */}
        {selectedReportId ? (
          <CustomerReportDetail
            reportId={selectedReportId}
            onBack={() => setSelectedReportId(null)}
          />
        ) : activeTab === "MY_REPORTS" ? (
          <CustomerReportsList onSelectReport={(id) => setSelectedReportId(id)} />
        ) : (
          <CustomerLostFoundForm onSuccess={() => setActiveTab("MY_REPORTS")} />
        )}
      </div>
    </div>
  );
}
