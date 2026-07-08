import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabase';
import IncidentTable from '@/components/incidents/IncidentTable';
import { RoomIncident } from '@/types/incident';

// Đảm bảo trang luôn lấy dữ liệu mới nhất, không bị cache
export const revalidate = 0; 

export default async function IncidentsPage() {
  // Lấy dữ liệu từ database (Có thể thêm try/catch nếu muốn xử lý lỗi strict hơn)
  const { data, error } = await supabase
    .from('room_incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi khi fetch incidents:', error);
  }

  const incidents = (data || []) as RoomIncident[];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý sự cố phòng</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Danh sách tất cả các sự cố tài sản, bảo trì, và khiếu nại hiện có trong khách sạn.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <a
            href="/admin/incidents/create"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            + Ghi nhận sự cố mới
          </a>
        </div>
      </div>

      {/* Tích hợp component Table */}
      <IncidentTable incidents={incidents} />
    </div>
  );
}