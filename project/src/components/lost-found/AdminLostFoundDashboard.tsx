"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { LostFoundReport, LostFoundStatusHistory, LostFoundReportStatus } from "@/types/lost-found-reports";
import { LostFoundStatusBadge, STATUS_CONFIG } from "./LostFoundStatusBadge";

export const AdminLostFoundDashboard: React.FC = () => {
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // State Modal Cập Nhật
  const [selectedReport, setSelectedReport] = useState<LostFoundReport | null>(null);
  const [history, setHistory] = useState<LostFoundStatusHistory[]>([]);
  const [newStatus, setNewStatus] = useState<LostFoundReportStatus>("UNDER_INVESTIGATION");
  const [assignedStaff, setAssignedStaff] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>("");
  const [updateSuccess, setUpdateSuccess] = useState<string>("");

  const fetchAdminReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/admin/lost-found?${params.toString()}`);
      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "Không thể tải dữ liệu quản lý đồ thất lạc");
        return;
      }

      setReports(resData.data || []);
    } catch (err) {
      setError("Lỗi kết nối khi lấy dữ liệu cho Admin.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchAdminReports();
  }, [fetchAdminReports]);

  const handleOpenDetailModal = async (report: LostFoundReport) => {
    setSelectedReport(report);
    setNewStatus(report.status as LostFoundReportStatus);
    setAssignedStaff(report.assigned_staff_name || "");
    setAdminNote(report.admin_note || "");
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const res = await fetch(`/api/lost-found/${report.id}/history`);
      const resData = await res.json();
      if (res.ok) {
        setHistory(resData.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi lấy history:", err);
    }
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const res = await fetch(`/api/admin/lost-found/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          assigned_staff_name: assignedStaff.trim() || undefined,
          admin_note: adminNote.trim() || undefined,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setUpdateError(resData.error || "Cập nhật tiến trình thất bại.");
        return;
      }

      setUpdateSuccess("Đã cập nhật tiến trình tìm kiếm & hoàn trả thành công!");
      await fetchAdminReports();
      if (selectedReport) {
        handleOpenDetailModal(resData.data);
      }
    } catch (err) {
      setUpdateError("Lỗi hệ thống khi cập nhật báo cáo.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Thanh Tiêu Đề */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Quản Lý & Điều Hành Đồ Thất Lạc (Admin)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi, phân công nhân viên tìm kiếm và hoàn trả đồ thất lạc đã được Lễ tân duyệt.
          </p>
        </div>
        <button
          onClick={fetchAdminReports}
          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới dữ liệu
        </button>
      </div>

      {/* Thanh Bộ Lọc Đa Tiêu Chí */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tìm kiếm từ khóa */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Từ khóa tìm kiếm</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tên đồ vật, tên khách, SĐT..."
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
          />
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái xử lý</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white font-medium"
          >
            <option value="ALL">Tất cả trạng thái xác nhận</option>
            <option value="CONFIRMED_BY_RECEPTIONIST">Lễ tân mới xác nhận</option>
            <option value="UNDER_INVESTIGATION">Đang điều tra / tìm kiếm</option>
            <option value="FOUND">Đã tìm thấy đồ</option>
            <option value="NOT_FOUND">Không tìm thấy</option>
            <option value="RETURNED_TO_CUSTOMER">Đã trả lại khách hàng</option>
            <option value="CLOSED">Đã đóng yêu cầu</option>
          </select>
        </div>

        {/* Từ ngày */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Từ ngày tạo</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
          />
        </div>

        {/* Đến ngày */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Đến ngày</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 text-xs bg-red-50 text-red-800 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Bảng Dữ Liệu Admin */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Đang nạp dữ liệu điều hành...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Chưa có báo cáo nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Món đồ</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Vị trí / SĐT</th>
                  <th className="px-6 py-4">Nhân viên tìm kiếm</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Quản lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reports.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {item.item_name}
                      <span className="block text-xs font-normal text-gray-400">
                        {new Date(item.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                      {item.user_name}
                      <span className="block text-xs text-gray-400">{item.user_email}</span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>{item.lost_location || (item as any).where_found || "Chưa rõ"}</div>
                      <div className="font-mono text-gray-500">{item.contact_phone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.assigned_staff_name || "Chưa phân công"}
                    </td>
                    <td className="px-6 py-4">
                      <LostFoundStatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetailModal(item)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
                      >
                        Cập nhật & Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cập Nhật Trạng Thái & Timeline Cho Admin */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase">Quản Lý Tìm Kiếm & Hoàn Trả</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selectedReport.item_name}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {updateSuccess && (
              <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                {updateSuccess}
              </div>
            )}
            {updateError && (
              <div className="p-3 text-xs bg-red-50 text-red-800 rounded-xl border border-red-200">
                {updateError}
              </div>
            )}

            {/* Thông tin nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
              <div>
                <span className="text-gray-400 block font-semibold">Khách hàng:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedReport.user_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">SĐT:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedReport.contact_phone}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">Trạng thái hiện tại:</span>
                <div className="mt-1">
                  <LostFoundStatusBadge status={selectedReport.status} />
                </div>
              </div>
            </div>

            {/* Form Cập Nhật Cho Admin */}
            <form onSubmit={handleUpdateReport} className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-4">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Form Điều Hành & Phân Công</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chuyển Trạng Thái Quản Lý *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LostFoundReportStatus)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs font-semibold"
                  >
                    <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION (Đang điều tra / tìm kiếm)</option>
                    <option value="FOUND">FOUND (Đã tìm thấy đồ)</option>
                    <option value="NOT_FOUND">NOT_FOUND (Không tìm thấy đồ)</option>
                    <option value="RETURNED_TO_CUSTOMER">RETURNED_TO_CUSTOMER (Đã bàn giao cho Khách)</option>
                    <option value="CLOSED">CLOSED (Đóng hồ sơ yêu cầu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nhân viên được phân công tìm kiếm</label>
                  <input
                    type="text"
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A (Security / Housekeeping)"
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ghi chú quá trình xử lý của Admin</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Ghi nhận diễn biến tìm kiếm, địa điểm lưu giữ đồ hoặc biên bản bàn giao..."
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  {updating ? "Đang lưu..." : "Cập Nhật Tiến Trình"}
                </button>
              </div>
            </form>

            {/* Timeline Toàn Bộ Lịch Sử Thay Đổi */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Timeline Nhật Ký Xử Lý</h4>
              {history.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Chưa có lịch sử cập nhật.</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-4 max-h-48 overflow-y-auto pr-2">
                  {history.map((h) => {
                    const cfg = STATUS_CONFIG[h.new_status];
                    return (
                      <div key={h.id} className="relative text-xs">
                        <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${cfg?.dotClass || "bg-gray-400"}`} />
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200">
                            <span>{cfg?.label || h.new_status}</span>
                            <span className="text-[10px] text-gray-400">{new Date(h.created_at).toLocaleString("vi-VN")}</span>
                          </div>
                          <div className="text-gray-500 text-[11px] mt-0.5">
                            Thực hiện: <strong>{h.actor_name}</strong> ({h.actor_role})
                          </div>
                          {h.note && (
                            <p className="text-gray-600 dark:text-gray-300 italic mt-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                              &quot;{h.note}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
