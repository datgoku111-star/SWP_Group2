"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateLostFoundReportSchema, CreateLostFoundReportInput } from "@/types/lost-found-reports";
import { useAuth } from "@/lib/auth-context";

interface CustomerLostFoundFormProps {
  onSuccess?: () => void;
}

export const CustomerLostFoundForm: React.FC<CustomerLostFoundFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLostFoundReportInput>({
    resolver: zodResolver(CreateLostFoundReportSchema),
    defaultValues: {
      item_name: "",
      description: "",
      lost_location: "",
      lost_at: new Date().toISOString().slice(0, 16),
      contact_phone: user?.phone || "",
      image_url: "",
    },
  });

  const onSubmit = async (data: CreateLostFoundReportInput) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const payload = {
        ...data,
        booking_id: data.booking_id || null,
        room_id: data.room_id || null,
        image_url: data.image_url || null,
      };

      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        setSubmitError(resData.error || "Không thể gửi báo cáo đồ thất lạc.");
        return;
      }

      setSubmitSuccess("Báo cáo của bạn đã được gửi thành công! Lễ tân sẽ sớm kiểm tra và xác nhận.");
      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setSubmitError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Báo Khai Báo Đồ Thất Lạc
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vui lòng cung cấp chi tiết thông tin món đồ bạn bỏ quên hoặc làm mất tại khách sạn để bộ phận Lễ tân & Quản lý hỗ trợ tìm kiếm.
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 mb-6 text-sm text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{submitSuccess}</span>
        </div>
      )}

      {submitError && (
        <div className="p-4 mb-6 text-sm text-red-800 bg-red-50 rounded-xl border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tên đồ vật */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Tên đồ vật <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("item_name")}
              placeholder="Ví dụ: Đồng hồ Apple Watch, Ví tiền, Chìa khóa..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {errors.item_name && <p className="text-xs text-red-500 mt-1">{errors.item_name.message}</p>}
          </div>

          {/* Số điện thoại liên hệ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("contact_phone")}
              placeholder="0912345678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {errors.contact_phone && <p className="text-xs text-red-500 mt-1">{errors.contact_phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Thời gian phát hiện mất */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Ngày & Giờ nghi ngờ phát hiện mất
            </label>
            <input
              type="datetime-local"
              {...register("lost_at")}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Phòng hoặc khu vực nghi ngờ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Phòng hoặc Khu vực nghi ngờ thất lạc
            </label>
            <input
              type="text"
              {...register("lost_location")}
              placeholder="Ví dụ: Phòng 302, Khu vực nhà hàng, Hồ bơi tầng 5..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* URL Hình ảnh */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Đường dẫn hình ảnh đồ vật (nếu có)
          </label>
          <input
            type="url"
            {...register("image_url")}
            placeholder="https://example.com/hinh-anh-do-vat.jpg"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
          />
          {errors.image_url && <p className="text-xs text-red-500 mt-1">{errors.image_url.message}</p>}
        </div>

        {/* Mô tả chi tiết */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Mô tả chi tiết đồ vật
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Ví dụ: Túi xách màu nâu hiệu Gucci, bên trong có 1 chìa khóa xe và ví tiền nhỏ..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg hover:shadow-primary-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang gửi yêu cầu...
              </>
            ) : (
              "Gửi Báo Cáo Thất Lạc"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
