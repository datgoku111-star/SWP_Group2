import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabase';
import CustomerTable from '@/components/loyalty/CustomerTable';
import { CustomerProfile } from '@/types/customer-loyalty';
import { Route } from '@/routers/types';

export const revalidate = 0; // Đảm bảo dữ liệu điểm số luôn mới nhất khi reload

export default async function AdminCustomersPage() {
  // Lấy danh sách hồ sơ khách hàng từ database
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
  }

  const customers = (data || []) as CustomerProfile[];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Khách hàng & Điểm thưởng</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Danh sách tài khoản khách hàng, phân hạng thẻ VIP và quản lý số dư điểm thưởng (Loyalty Program).
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <a
            href={"/admin/customers/create" as Route}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Thêm khách hàng mới
          </a>
        </div>
      </div>

      {/* Gọi component bảng dữ liệu */}
      <CustomerTable customers={customers} />
    </div>
  );
}