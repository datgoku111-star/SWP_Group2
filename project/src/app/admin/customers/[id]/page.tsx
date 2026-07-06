import React from "react";
import { supabaseServer as supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import LoyaltyTimeline from "@/components/loyalty/LoyaltyTimeline";

export const revalidate = 0; // Tắt cache để điểm số luôn chuẩn xác theo thời gian thực

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // 1. Fetch thông tin hồ sơ chi tiết của khách hàng
  const { data: customer, error: customerError } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (customerError || !customer) {
    return notFound(); // Trả về trang 404 nếu mã ID UUID sai lệch hoặc không tồn tại
  }

  // 2. Fetch lịch sử biến động ví điểm (Mới nhất xếp trên cùng)
  const { data: history } = await supabase
    .from("loyalty_points_history")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto space-y-6">
      
      {/* Khối Thẻ hồ sơ Thông tin chung của khách hàng */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <div className="sm:flex sm:items-center sm:justify-between mb-4 border-b pb-4 border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Khách hàng: <span className="text-indigo-600 dark:text-indigo-400">{customer.full_name}</span>
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-1">ID: {customer.id}</p>
          </div>
          <span className="mt-2 sm:mt-0 inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-purple-900/40 dark:text-purple-300">
            Hạng: {customer.membership_level}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Số dư điểm khả dụng</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{customer.current_points} P</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tổng tích lũy trọn đời</p>
            <p className="mt-2 text-2xl font-bold text-gray-700 dark:text-gray-300">{customer.total_accumulated_points} P</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tổng chi tiêu</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.total_spent)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Liên hệ</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-300 truncate font-medium">{customer.email || '---'}</p>
            <p className="text-xs text-gray-400 font-mono">{customer.phone || '---'}</p>
          </div>
          
          <div className="sm:col-span-2 md:col-span-4">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Ghi chú đặc điểm & Sở thích</p>
            <p className="mt-2 text-sm text-gray-900 dark:text-gray-300 whitespace-pre-wrap bg-yellow-50/40 dark:bg-gray-900/20 p-4 rounded-md border border-yellow-100 dark:border-gray-700 italic">
              {customer.preferences_notes || "Chưa có ghi chú đặc biệt nào về sở thích của vị khách này."}
            </p>
          </div>
        </div>
      </div>

      {/* Khối hiển thị Trục Timeline Lịch sử Điểm */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
          Nhật ký biến động điểm thưởng
        </h2>
        <LoyaltyTimeline history={history || []} />
      </div>
      
    </div>
  );
}