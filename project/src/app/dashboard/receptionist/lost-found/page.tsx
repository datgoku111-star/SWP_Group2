"use client";

import React from "react";
import { ReceptionistLostFoundDashboard } from "@/components/lost-found/ReceptionistLostFoundDashboard";

export default function ReceptionistLostFoundPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Lễ Tân — Tiếp Nhận Báo Cáo Đồ Thất Lạc
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Xác nhận tính hợp lệ của báo cáo từ Khách hàng, từ chối hoặc yêu cầu bổ sung thông tin trước khi chuyển sang Admin xử lý.
        </p>
      </div>

      <ReceptionistLostFoundDashboard />
    </div>
  );
}
