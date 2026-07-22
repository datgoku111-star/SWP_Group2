"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { LostFoundReport } from "@/types/lost-found-reports";
import { LostFoundStatusBadge } from "./LostFoundStatusBadge";

interface CustomerReportsListProps {
  onSelectReport?: (reportId: string) => void;
}

export const CustomerReportsList: React.FC<CustomerReportsListProps> = ({ onSelectReport }) => {
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/lost-found/my-reports");
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "Không thể lấy danh sách báo cáo");
        return;
      }
      setReports(resData.data || []);
    } catch (err) {
      setError("Lỗi kết nối khi tải danh sách báo cáo đồ thất lạc.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách báo cáo đồ thất lạc...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-2xl text-center border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300 text-sm mb-3">{error}</p>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Chưa có báo cáo nào</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Bạn chưa tạo báo cáo đồ thất lạc nào. Hãy bấm sang tab &quot;Báo Mất Đồ&quot; để gửi báo cáo mới.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Danh Sách Báo Cáo Của Tôi ({reports.length})
        </h3>
        <button
          onClick={fetchReports}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">{report.item_name}</h4>
                <LostFoundStatusBadge status={report.status} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {report.description || "Không có mô tả chi tiết."}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>📍 Vị trí: {report.lost_location || "Chưa xác định"}</span>
                {report.lost_at && <span>🕒 Ngày mất: {new Date(report.lost_at).toLocaleString("vi-VN")}</span>}
                <span>📅 Ngày tạo: {new Date(report.created_at).toLocaleString("vi-VN")}</span>
              </div>

              {/* Thông báo nếu Lễ tân yêu cầu bổ sung thông tin */}
              {report.status === "REQUEST_MORE_INFO" && report.receptionist_note && (
                <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/40 rounded-xl border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-300">
                  <span className="font-bold">Yêu cầu từ Lễ tân: </span> {report.receptionist_note}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {onSelectReport ? (
                <button
                  onClick={() => onSelectReport(report.id)}
                  className="px-4 py-2 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-xl hover:bg-primary-100 transition"
                >
                  Xem chi tiết
                </button>
              ) : (
                <Link
                  href={`/lost-found/${report.id}`}
                  className="px-4 py-2 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-xl hover:bg-primary-100 transition"
                >
                  Xem chi tiết & Theo dõi
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
