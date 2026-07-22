import React from "react";
import type { LostFoundReportStatus } from "@/types/lost-found-reports";

interface StatusBadgeProps {
  status: LostFoundReportStatus;
  className?: string;
}

export const STATUS_CONFIG: Record<
  LostFoundReportStatus,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  PENDING_RECEPTIONIST: {
    label: "Chờ Lễ tân xác nhận",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    textClass: "text-amber-800 dark:text-amber-300 border-amber-300",
    dotClass: "bg-amber-500",
  },
  CONFIRMED_BY_RECEPTIONIST: {
    label: "Lễ tân đã xác nhận",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-800 dark:text-blue-300 border-blue-300",
    dotClass: "bg-blue-500",
  },
  REQUEST_MORE_INFO: {
    label: "Cần bổ sung thông tin",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    textClass: "text-orange-800 dark:text-orange-300 border-orange-300",
    dotClass: "bg-orange-500",
  },
  REJECTED: {
    label: "Đã từ chối",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    textClass: "text-red-800 dark:text-red-300 border-red-300",
    dotClass: "bg-red-500",
  },
  UNDER_INVESTIGATION: {
    label: "Đang tìm kiếm",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    textClass: "text-purple-800 dark:text-purple-300 border-purple-300",
    dotClass: "bg-purple-500",
  },
  FOUND: {
    label: "Đã tìm thấy đồ",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    textClass: "text-emerald-800 dark:text-emerald-300 border-emerald-300",
    dotClass: "bg-emerald-500",
  },
  NOT_FOUND: {
    label: "Không tìm thấy",
    bgClass: "bg-slate-100 dark:bg-slate-800",
    textClass: "text-slate-700 dark:text-slate-300 border-slate-300",
    dotClass: "bg-slate-400",
  },
  RETURNED_TO_CUSTOMER: {
    label: "Đã trả cho Khách",
    bgClass: "bg-indigo-100 dark:bg-indigo-900/30",
    textClass: "text-indigo-800 dark:text-indigo-300 border-indigo-300",
    dotClass: "bg-indigo-500",
  },
  CLOSED: {
    label: "Đã đóng yêu cầu",
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-600 dark:text-gray-400 border-gray-300",
    dotClass: "bg-gray-400",
  },
};

export const LostFoundStatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bgClass: "bg-gray-100",
    textClass: "text-gray-700",
    dotClass: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
};
