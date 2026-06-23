"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  CreditCard, 
  BedDouble, 
  TrendingUp, 
  TrendingDown,
  Calendar
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard statistics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-6000 border-t-transparent"></div>
          <p className="text-sm font-medium text-neutral-500 animate-pulse">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  const { stats, monthlySignups, monthlyRevenue } = data || {
    stats: { totalUsers: 0, totalRevenue: 0, activeBookings: 0 },
    monthlySignups: [],
    monthlyRevenue: []
  };

  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      {/* Title Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Customer Report
          </h1>
          <p className="text-sm font-semibold text-neutral-500 tracking-widest uppercase mt-1">
            STATISTICAL GRAPH
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <span>Tháng này: {new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Decorative Navigation Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center space-x-3 bg-neutral-800 text-white px-6 py-3 rounded-full justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <span className="font-bold text-sm tracking-wide">Customer Lifetime Value (Doanh thu)</span>
          </div>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
        <div className="flex items-center space-x-3 bg-neutral-800 text-white px-6 py-3 rounded-full justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="font-bold text-sm tracking-wide">Purchase Frequency (Lượt đăng ký mới)</span>
          </div>
          <span className="w-3 h-3 rounded-full bg-pink-400"></span>
        </div>
      </div>

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-neutral-400">Tổng Thành Viên</span>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats.totalUsers}
              </h3>
              <div className="flex items-center text-xs font-semibold text-green-500 space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Số liệu thực tế từ User Management</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-4 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-neutral-400">Tổng Doanh Thu</span>
              <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.totalRevenue)}
              </h3>
              <div className="flex items-center text-xs font-semibold text-green-500 space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Số liệu thực tế từ Payments</span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-neutral-400">Đơn Đặt Phòng Active</span>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats.activeBookings}
              </h3>
              <div className="flex items-center text-xs font-semibold text-red-500 space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>-2.4% so với tuần trước</span>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-4 rounded-2xl">
              <BedDouble className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Customer Lifetime Value (Revenue trend, Area chart) */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
              Customer Lifetime Value
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Xu hướng doanh thu thực tế theo các tháng từ payments</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E48F9F" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E48F9F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString("vi-VN")} đ`} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#E48F9F" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={{ stroke: '#E48F9F', strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase Frequency (New registrations trend, Bar chart) */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
              Purchase Frequency
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Xu hướng số lượng thành viên mới đăng ký từ user management</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySignups} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => `${Number(value)} thành viên`} />
                <Bar dataKey="count" name="Đăng ký mới" fill="#E48F9F" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
