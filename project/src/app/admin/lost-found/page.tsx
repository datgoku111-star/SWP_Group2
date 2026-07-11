import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabase';
import LostFoundTable from '@/components/lost-found/LostFoundTable';
import { LostFoundItem } from '@/types/lost-found';
import { Route } from '@/routers/types';

export const revalidate = 0; // Tắt cache

export default async function LostFoundPage() {
  const { data, error } = await supabase
    .from('lost_found_items')
    .select('*')
    .order('found_at', { ascending: false });

  if (error) {
    console.error('Lỗi khi fetch đồ thất lạc:', error);
  }

  const items = (data || []) as LostFoundItem[];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Đồ thất lạc</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Danh sách các vật dụng khách hàng để quên hoặc thất lạc tại khách sạn.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {/* Nút này sẽ dẫn đến trang tạo mới đồ thất lạc (Có thể làm ở phase phụ nếu cần) */}
          <a
            href={"/admin/lost-found/create" as Route}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            + Ghi nhận đồ thất lạc
          </a>
        </div>
      </div>

      <LostFoundTable items={items} />
    </div>
  );
}