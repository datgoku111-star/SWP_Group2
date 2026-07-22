"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { LostFoundReport, LostFoundStatusHistory } from "@/types/lost-found-reports";
import { LostFoundStatusBadge, STATUS_CONFIG } from "./LostFoundStatusBadge";

interface CustomerReportDetailProps {
  reportId: string;
  onBack?: () => void;
}

export const CustomerReportDetail: React.FC<CustomerReportDetailProps> = ({ reportId, onBack }) => {
  const [report, setReport] = useState<LostFoundReport | null>(null);
  const [history, setHistory] = useState<LostFoundStatusHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // State hỗ trợ bổ sung thông tin khi REQUEST_MORE_INFO
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [lostLocation, setLostLocation] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [resReport, resHistory] = await Promise.all([
        fetch(`/api/lost-found/${reportId}`),
        fetch(`/api/lost-found/${reportId}/history`),
      ]);

      const dataReport = await resReport.json();
      const dataHistory = await resHistory.json();

      if (!resReport.ok) {
        setError(dataReport.error || "Không thể tải thông tin báo cáo.");
        return;
      }

      setReport(dataReport.data);
      setDescription(dataReport.data.description || "");
      setContactPhone(dataReport.data.contact_phone || "");
      setLostLocation(dataReport.data.lost_location || "");

      if (resHistory.ok) {
        setHistory(dataHistory.data || []);
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ khi tải dữ liệu chi tiết.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateMsg("");
    try {
      const res = await fetch(`/api/lost-found/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          contact_phone: contactPhone,
          lost_location: lostLocation,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setUpdateMsg(resData.error || "Cập nhật thất bại");
        return;
      }

      setUpdateMsg("Đã bổ sung thông tin thành công! Yêu cầu đã chuyển lại cho Lễ tân xử lý.");
      setIsEditing(false);
      loadData();
    } catch (err) {
      setUpdateMsg("Lỗi kết nối khi gửi thông tin bổ sung.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Đang tải thông tin chi tiết báo cáo...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-2xl text-center border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300 text-sm mb-4">{error || "Không tìm thấy dữ liệu"}</p>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded-xl text-xs font-semibold">
            Quay lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </button>
      )}

      {updateMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800">
          {updateMsg}
        </div>
      )}

      {/* Box thông tin tổng quan */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mã Báo Cáo Thất Lạc</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{report.item_name}</h2>
          </div>
          <LostFoundStatusBadge status={report.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">Mô tả đặc điểm</span>
            <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
              {report.description || "Không có mô tả chi tiết."}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-gray-400 block">Vị trí nghi ngờ thất lạc:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{report.lost_location || "Chưa xác định"}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 block">Số điện thoại liên hệ:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{report.contact_phone}</span>
            </div>
            {report.lost_at && (
              <div>
                <span className="text-xs font-semibold text-gray-400 block">Thời gian phát hiện:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(report.lost_at).toLocaleString("vi-VN")}</span>
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-gray-400 block">Ngày gửi báo cáo:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(report.created_at).toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>

        {/* Khối phản hồi từ Receptionist/Admin */}
        {report.receptionist_note && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-sm">
            <span className="font-bold text-blue-900 dark:text-blue-300">Ghi chú từ Lễ tân: </span>
            <span className="text-blue-800 dark:text-blue-200">{report.receptionist_note}</span>
          </div>
        )}

        {report.admin_note && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-sm">
            <span className="font-bold text-purple-900 dark:text-purple-300">Ghi chú từ Ban Quản lý / Admin: </span>
            <span className="text-purple-800 dark:text-purple-200">{report.admin_note}</span>
            {report.assigned_staff_name && (
              <div className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                Nhân viên phụ trách tìm kiếm: <strong>{report.assigned_staff_name}</strong>
              </div>
            )}
          </div>
        )}

        {/* Nút kích hoạt form Bổ sung thông tin nếu Lễ tân yêu cầu */}
        {report.status === "REQUEST_MORE_INFO" && !isEditing && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Bổ sung thông tin theo yêu cầu
            </button>
          </div>
        )}

        {/* Form Bổ sung thông tin */}
        {isEditing && (
          <form onSubmit={handleUpdateInfo} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4 bg-orange-50/50 dark:bg-orange-950/20 p-5 rounded-2xl">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Cập nhật bổ sung thông tin đồ thất lạc</h4>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mô tả bổ sung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vị trí nghi ngờ</label>
                <input
                  type="text"
                  value={lostLocation}
                  onChange={(e) => setLostLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition"
              >
                {updating ? "Đang lưu..." : "Gửi thông tin cập nhật"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Timeline Lịch sử thay đổi trạng thái */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lịch Sử Xử Lý & Tiến Độ
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có lịch sử cập nhật.</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
            {history.map((item) => {
              const statusCfg = STATUS_CONFIG[item.new_status];
              return (
                <div key={item.id} className="relative group">
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${statusCfg?.dotClass || "bg-gray-400"}`} />
                  <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {statusCfg?.label || item.new_status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Thực hiện bởi: <strong className="text-gray-700 dark:text-gray-300">{item.actor_name}</strong> ({item.actor_role})
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-white dark:bg-gray-800 p-2 rounded-lg mt-2 border border-gray-100 dark:border-gray-700">
                        &quot;{item.note}&quot;
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
  );
};
