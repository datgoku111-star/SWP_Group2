import React from 'react';
import { CustomerProfile } from '@/types/customer-loyalty';
import { Route } from '@/routers/types';

interface CustomerTableProps {
  customers: CustomerProfile[];
}

export default function CustomerTable({ customers }: CustomerTableProps) {
  if (!customers || customers.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu tài khoản khách hàng.</p>
      </div>
    );
  }

  // Hàm helper để render màu sắc badge theo hạng thành viên
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'DIAMOND':
        return 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-400';
      case 'GOLD':
        return 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400';
      case 'SILVER':
        return 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-900/30 dark:text-slate-400';
      default:
        return 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6">Tên khách hàng</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Liên hệ</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Hạng</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Điểm hiện tại</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Tổng chi tiêu</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6">
                {customer.full_name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                <div>{customer.email || '---'}</div>
                <div className="text-xs text-gray-400">{customer.phone || '---'}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getLevelBadge(customer.membership_level)}`}>
                  {customer.membership_level}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                {customer.current_points} P
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.total_spent)}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <a href={`/admin/customers/${customer.id}` as Route} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Xem chi tiết
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}