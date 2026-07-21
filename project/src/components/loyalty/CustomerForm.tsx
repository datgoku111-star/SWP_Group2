"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CustomerProfileSchema, CustomerProfileInput } from "@/types/customer-loyalty";
import { Route } from "@/routers/types";

export default function CustomerForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerProfileInput>({
    resolver: zodResolver(CustomerProfileSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      preferences_notes: "",
      membership_level: "STANDARD",
    },
  });

  const onSubmit = async (data: CustomerProfileInput) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/custumers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Đã xảy ra lỗi khi tạo hồ sơ khách hàng.");
        return;
      }

      // Tạo thành công, quay lại trang danh sách khách hàng
      router.push("/admin/customers" as Route);
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
        {/* Tên khách hàng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên *</label>
          <input
            type="text"
            {...register("full_name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder="Ví dụ: Nguyễn Văn A"
          />
          {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>}
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
          <input
            type="text"
            {...register("phone")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder="Ví dụ: 0912345678"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ Email</label>
          <input
            type="text"
            {...register("email")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder="example@gmail.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        {/* Ghi chú sở thích */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sở thích & Lưu ý của khách hàng</label>
          <textarea
            {...register("preferences_notes")}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder="Ví dụ: Thích phòng tầng cao, dị ứng lông thú, yêu cầu nệm mềm..."
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.push("/admin/customers" as Route)}
          className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Đang lưu..." : "Tạo khách hàng"}
        </button>
      </div>
    </form>
  );
}