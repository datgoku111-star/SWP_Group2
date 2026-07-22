"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { LostFoundReport, LostFoundStatusHistory } from "@/types/lost-found-reports";
import { LostFoundStatusBadge } from "./LostFoundStatusBadge";

export const ReceptionistLostFoundDashboard: React.FC = () => {
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("PENDING_RECEPTIONIST");

  // State modal xem chi tiết & xử lý
  const [selectedReport, setSelectedReport] = useState<LostFoundReport | null>(null);
  const [history, setHistory] = useState<LostFoundStatusHistory[]>([]);
  const [actionModalType, setActionModalType] = useState<"CONFIRMED" | "REJECTED" | "REQUEST_MORE_INFO" | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = filterStatus !== "ALL" ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/receptionist/lost-found${query}`);
      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "Không thể lấy danh sách báo cáo đồ thất lạc.");
        return;
      }

      setReports(resData.data || []);
      setPendingCount(resData.pendingCount || 0);
    } catch (err) {
      setError("Lỗi kết nối khi lấy dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Load history khi chọn report
  const handleSelectReport = async (report: LostFoundReport) => {
    setSelectedReport(report);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/lost-found/${report.id}/history`);
      const resData = await res.json();
      if (res.ok) {
        setHistory(resData.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử:", err);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedReport || !actionModalType) return;

    if ((actionModalType === "REJECTED" || actionModalType === "REQUEST_MORE_INFO") && !noteInput.trim()) {
      setActionError("Vui lòng nhập ghi chú/lý do cho hành động này.");
      return;
    }

    setProcessing(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/receptionist/lost-found/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModalType,
          note: noteInput.trim() || undefined,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setActionError(resData.error || "Xử lý yêu cầu thất bại");
        return;
      }

      setActionSuccess(`Đã xử lý thành công yêu cầu thành ${actionModalType}`);
      setActionModalType(null);
      setNoteInput("");
      
      // Refresh dữ liệu
      await fetchReports();
      if (selectedReport) {
        handleSelectReport(resData.data);
      }
    } catch (err) {
      setActionError("Lỗi kết nối máy chủ khi xử lý yêu cầu.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget Thống kê Top Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Yêu Cầu Chờ Xác Nhận
            </span>
            <div className="text-3xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">{pendingCount}</div>
          </div>
          <div className="w-12 h-12 bg-amber-200/60 dark:bg-amber-900/60 rounded-xl flex items-center justify-center text-amber-800 dark:text-amber-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Tổng Báo Cáo Đã Tải
            </span>
            <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">{reports.length}</div>
          </div>
          <div className="w-12 h-12 bg-blue-200/60 dark:bg-blue-900/60 rounded-xl flex items-center justify-center text-blue-800 dark:text-blue-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Bộ Lọc Trạng Thái</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full text-xs font-semibold rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="PENDING_RECEPTIONIST">Chờ Lễ tân xác nhận</option>
              <option value="CONFIRMED_BY_RECEPTIONIST">Đã xác nhận</option>
              <option value="REQUEST_MORE_INFO">Cần bổ sung thông tin</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="ALL">Tất cả trạng thái</option>
            </select>
          </div>
          <button
            onClick={fetchReports}
            className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition"
            title="Tải lại dữ liệu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 text-sm bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Bảng Danh Sách Đồ Thất Lạc */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Tiếp Nhận Đồ Thất Lạc từ Khách Hàng
          </h3>
          <span className="text-xs text-gray-400">Cập nhật tự động</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Đang nạp dữ liệu...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Không tìm thấy báo cáo nào trong mục này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Món đồ</th>
                  <th className="px-6 py-4">Vị trí nghi ngờ</th>
                  <th className="px-6 py-4">SĐT</th>
                  <th className="px-6 py-4">Ngày gửi</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reports.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {item.user_name}
                      {item.room_number && (
                        <span className="block text-xs font-normal text-gray-400">Phòng {item.room_number}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                      {item.item_name}
                      <span className="block text-xs text-gray-400 line-clamp-1">{item.description}</span>
                    </td>
                    <td className="px-6 py-4 text-xs">{item.lost_location || "—"}</td>
                    <td className="px-6 py-4 text-xs font-semibold">{item.contact_phone}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <LostFoundStatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSelectReport(item)}
                        className="px-3 py-1.5 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg hover:bg-primary-100 transition"
                      >
                        Chi tiết & Xử lý
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Xem Chi Tiết & Xử Lý Yêu Cầu */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Chi Tiết Báo Cáo Thất Lạc</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selectedReport.item_name}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 rounded-xl border border-red-200">
                {actionError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl">
                <span className="text-gray-400 block font-semibold">Khách hàng báo mất:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedReport.user_name}</span>
                <span className="block text-gray-400 mt-1">SĐT: {selectedReport.contact_phone}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl">
                <span className="text-gray-400 block font-semibold">Trạng thái hiện tại:</span>
                <div className="mt-1">
                  <LostFoundStatusBadge status={selectedReport.status} />
                </div>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="font-semibold text-gray-400">Vị trí nghi ngờ / Vị trí nhặt được:</span>{" "}
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {selectedReport.lost_location || (selectedReport as any).where_found || "Chưa rõ"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-400">Thời gian phát hiện / Ngày tạo:</span>{" "}
                <span className="text-gray-800 dark:text-gray-200">
                  {selectedReport.lost_at
                    ? new Date(selectedReport.lost_at).toLocaleString("vi-VN")
                    : selectedReport.created_at
                    ? new Date(selectedReport.created_at).toLocaleString("vi-VN")
                    : "Chưa nhập"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-400">Mô tả đặc điểm:</span>
                <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-700 dark:text-gray-300">
                  {selectedReport.description || "Không có mô tả."}
                </p>
              </div>
            </div>

            {/* Các Nút Hành Động Của Receptionist */}
            <div className="bg-slate-50 dark:bg-gray-900/80 p-4 rounded-2xl border border-slate-200 dark:border-gray-700 space-y-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Xử Lý Báo Cáo Này (Quyền Lễ Tân)</span>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActionModalType("CONFIRMED")}
                  className="flex-1 min-w-[120px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
                >
                  ✓ Xác nhận yêu cầu
                </button>
                <button
                  onClick={() => setActionModalType("REQUEST_MORE_INFO")}
                  className="flex-1 min-w-[120px] px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow transition"
                >
                  ✍️ Yêu cầu bổ sung
                </button>
                <button
                  onClick={() => setActionModalType("REJECTED")}
                  className="flex-1 min-w-[120px] px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow transition"
                >
                  ✕ Từ chối
                </button>
              </div>
            </div>

            {/* Form nhập note khi chọn hành động */}
            {actionModalType && (
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Xác nhận chuyển đổi sang: <strong>{actionModalType}</strong>
                  </span>
                  <button onClick={() => setActionModalType(null)} className="text-xs text-amber-700 underline">
                    Hủy
                  </button>
                </div>

                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={3}
                  placeholder={
                    actionModalType === "CONFIRMED"
                      ? "Nhập ghi chú xác nhận (không bắt buộc)..."
                      : "Nhập lý do cụ thể gửi tới khách hàng (Bắt buộc)..."
                  }
                  className="w-full p-3 rounded-xl border border-amber-300 dark:border-amber-700 text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleExecuteAction}
                    disabled={processing}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                  >
                    {processing ? "Đang lưu..." : "Xác nhận thực hiện"}
                  </button>
                </div>
              </div>
            )}

            {/* Lịch sử trạng thái */}
            {history.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Lịch Sử Thay Đổi Trạng Thái</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div key={h.id} className="text-xs p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{h.new_status}</span>
                        <span className="text-gray-400 ml-2">bởi {h.actor_name} ({h.actor_role})</span>
                        {h.note && <p className="text-gray-500 italic mt-0.5">&quot;{h.note}&quot;</p>}
                      </div>
                      <span className="text-gray-400 text-[10px]">{new Date(h.created_at).toLocaleString("vi-VN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
