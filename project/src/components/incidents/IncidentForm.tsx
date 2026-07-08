"use client";

import { Route } from "@/routers/types";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CreateIncidentSchema, CreateIncidentInput } from "@/types/incident";
import { INCIDENT_TYPES, INCIDENT_SEVERITY } from "@/contains/incident";

export default function IncidentForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncidentInput>({
    resolver: zodResolver(CreateIncidentSchema),
    defaultValues: {
      estimated_charge: 0,
      is_chargeable: false,
    },
  });

  const onSubmit = async (data: CreateIncidentInput) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Đã xảy ra lỗi khi tạo sự cố.");
        return;
      }

      // Tạo thành công, quay về trang danh sách và làm mới dữ liệu
      router.push("/admin/incidents" as Route);
      router.refresh();
    } catch (error) {
      setSubmitError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
      {submitError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* ID Phòng - Lưu ý: Cần nhập UUID hợp lệ có trong bảng rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Phòng (UUID) *</label>
          <input
            type="text"
            {...register("room_id")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder="Ví dụ: 123e4567-e89b-12d3-a456-426614174000"
          />
          {errors.room_id && <p className="mt-1 text-sm text-red-500">{errors.room_id.message}</p>}
        </div>

        {/* Loại sự cố */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại sự cố *</label>
          <select
            {...register("incident_type")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
          >
            {Object.keys(INCIDENT_TYPES).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          {errors.incident_type && <p className="mt-1 text-sm text-red-500">{errors.incident_type.message}</p>}
        </div>

        {/* Mức độ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mức độ nghiêm trọng *</label>
          <select
            {...register("severity")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
          >
            {Object.keys(INCIDENT_SEVERITY).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          {errors.severity && <p className="mt-1 text-sm text-red-500">{errors.severity.message}</p>}
        </div>

        {/* Chi phí dự kiến */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chi phí bồi thường dự kiến (VND)</label>
          <input
            type="number"
            {...register("estimated_charge", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
          />
          {errors.estimated_charge && <p className="mt-1 text-sm text-red-500">{errors.estimated_charge.message}</p>}
        </div>
      </div>

      {/* Có tính phí không */}
      <div className="flex items-center">
        <input
          type="checkbox"
          {...register("is_chargeable")}
          id="is_chargeable"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="is_chargeable" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          Sự cố này cần thu phí bồi thường từ khách hàng
        </label>
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả sự cố *</label>
        <textarea
          {...register("description")}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
          placeholder="Mô tả chi tiết tình trạng..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.push('/admin/incidents' as Route)}
          className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Đang xử lý..." : "Lưu sự cố"}
        </button>
      </div>
    </form>
  );
}