"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  BedDouble,
  TrendingUp,
  Star,
  ArrowUpRight,
  TrendingDown,
  Calendar,
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
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

const RechartsResponsiveContainer = ResponsiveContainer as any;
const RechartsPieChart = PieChart as any;
const RechartsPie = Pie as any;
const RechartsCell = Cell as any;
const RechartsAreaChart = AreaChart as any;
const RechartsArea = Area as any;
const RechartsCartesianGrid = CartesianGrid as any;
const RechartsXAxis = XAxis as any;
const RechartsYAxis = YAxis as any;
const RechartsTooltip = Tooltip as any;
const RechartsBarChart = BarChart as any;
const RechartsBar = Bar as any;

// Colors matching the customer report image
const COLORS = [
  "#2E5B9A", // Age 18-25 Blue
  "#3B7A57", // Age 26-35 Green
  "#D4AF37", // Age 36-45 Gold
  "#E48F9F", // Age 46-55 Soft Pink
  "#5AC0C9", // Age 56+ Teal
];
export default function AdminDashboardPage() {
  const { t } = useTranslation();
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
          <p className="text-sm font-medium text-neutral-500 animate-pulse">
            {t("adminDashboardLoading")}
          </p>
        </div>
      </div>
    );
  }

  const { stats, monthlySignups, monthlyRevenue, roleDistribution = [] } = data || {
    stats: { totalUsers: 0, totalRevenue: 0, activeBookings: 0 },
    monthlySignups: [],
    monthlyRevenue: [],
    roleDistribution: [],
  };

  // Mock services data for "Preferred Products" in the image
  const preferredRooms = [
    { name: t("adminDashboardRoomDeluxe"), percentage: 89, value: "89%" },
    { name: t("adminDashboardRoomSuite"), percentage: 71, value: "71%" },
    { name: t("adminDashboardRoomStandard"), percentage: 47, value: "47%" },
    { name: t("adminDashboardRoomFamily"), percentage: 36, value: "36%" },
    { name: t("adminDashboardRoomPresident"), percentage: 16, value: "16%" },
  ];

  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      {/* Title Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {t("adminDashboardTitle")}
          </h1>
          <p className="text-sm font-semibold text-neutral-500 tracking-widest uppercase mt-1">
            {t("adminDashboardSubtitle")}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <span>
            {t("adminDashboardMonth")}:{" "}
            {new Date().toLocaleDateString(
              i18n.language === "vn" ? "vi-VN" : "en-US",
              { month: "long", year: "numeric" },
            )}
          </span>
        </div>
      </div>

      {/* Decorative Navigation Indicators mimicking the image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center space-x-3 bg-neutral-800 text-white px-6 py-3 rounded-full justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="font-bold text-sm tracking-wide">
              {t("adminDashboardDemographics")}
            </span>
          </div>
          <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
        </div>
        <div className="flex items-center space-x-3 bg-neutral-800 text-white px-6 py-3 rounded-full justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <span className="font-bold text-sm tracking-wide">
              {t("adminDashboardPreferredProducts")}
            </span>
          </div>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
        <div className="flex items-center space-x-3 bg-neutral-800 text-white px-6 py-3 rounded-full justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="font-bold text-sm tracking-wide">
              {t("adminDashboardPurchaseFrequency")}
            </span>
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
              <span className="text-sm font-semibold text-neutral-400">
                {t("adminDashboardTotalUsers")}
              </span>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats.totalUsers}
              </h3>
              <div className="flex items-center text-xs font-semibold text-green-500 space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{t("adminDashboardTotalUsersTrend")}</span>
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
              <span className="text-sm font-semibold text-neutral-400">
                {t("adminDashboardTotalRevenue")}
              </span>
              <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(stats.totalRevenue)}
              </h3>
              <div className="flex items-center text-xs font-semibold text-green-500 space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{t("adminDashboardRevenueTrend")}</span>
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
              <span className="text-sm font-semibold text-neutral-400">
                {t("adminDashboardActiveBookings")}
              </span>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats.activeBookings}
              </h3>
              <div className="flex items-center text-xs font-semibold text-red-500 space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>{t("adminDashboardActiveBookingsTrend")}</span>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-4 rounded-2xl">
              <BedDouble className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Demographics (Pie Chart) & CLV (Line Chart) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Demographics Card */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
              {t("adminDashboardDemographics")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-3">
                {roleDistribution.map((entry: any, index: number) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between text-sm border-b border-neutral-50 dark:border-neutral-700/50 pb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></span>
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-neutral-900 dark:text-white">
                      {Math.round(
                        (entry.value /
                          roleDistribution.reduce(
                            (a: number, b: any) => a + b.value,
                            0,
                          )) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-48 flex justify-center items-center">
                <RechartsResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <RechartsPie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry: any, index: number) => (
                        <RechartsCell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </RechartsPie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "1rem",
                        overflow: "hidden",
                      }}
                    />
                  </RechartsPieChart>
                </RechartsResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Customer Lifetime Value / Revenue Trend */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
            <div className="border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
                {t("adminDashboardLifetimeValue")}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {t("adminDashboardLifetimeValueDesc")}
              </p>
            </div>
            <div className="h-64">
              <RechartsResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                  data={monthlyRevenue}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#E48F9F" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E48F9F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <RechartsCartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <RechartsXAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                  />
                  <RechartsYAxis
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value: any) =>
                      `${Number(value).toLocaleString("vi-VN")} đ`
                    }
                  />
                  <RechartsArea
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#E48F9F"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={{ stroke: "#E48F9F", strokeWidth: 2, r: 4 }}
                  />
                </RechartsAreaChart>
              </RechartsResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Preferred Products & Purchase Frequency & Satisfaction */}
        <div className="lg:col-span-7 space-y-8">
          {/* Preferred Products (Progress bars) */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
            <div className="border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
                Preferred Products
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Distribution of customers preferred categories
              </p>
            </div>
            <div className="space-y-4">
              {preferredRooms.map((room) => (
                <div key={room.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {room.name}
                    </span>
                    <span className="text-neutral-900 dark:text-white font-extrabold">
                      {room.value}
                    </span>
                  </div>
                  <div className="w-full bg-amber-100 dark:bg-neutral-700 h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-900 dark:bg-blue-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${room.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lower Row: Purchase Frequency (Bar chart) & Customer Satisfaction Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Purchase Frequency */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
              <div className="border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
                  Purchase Frequency
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Distribution based on purchase frequency
                </p>
              </div>
              <div className="h-60">
                <RechartsResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={monthlySignups}
                    margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                  >
                    <RechartsCartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <RechartsXAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                    />
                    <RechartsYAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip />
                    <RechartsBar
                      dataKey="count"
                      name="Đăng ký mới"
                      fill="#E48F9F"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={30}
                    />
                  </RechartsBarChart>
                </RechartsResponsiveContainer>
              </div>
            </div>

            {/* Satisfaction Ratings */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
              <div className="border-b border-neutral-100 dark:border-neutral-700 pb-3 mb-6">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
                  Customer Satisfaction
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Average customer satisfaction based on surveys
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { period: "2024 - 2025", rating: 4.8 },
                  { period: "2023 - 2024", rating: 4.5 },
                  { period: "2022 - 2023", rating: 3.8 },
                ].map((item, idx) => (
                  <div
                    key={item.period}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-750"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-400">
                        {item.period}
                      </span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(item.rating) ? "text-yellow-500 fill-yellow-500" : "text-neutral-300 dark:text-neutral-600"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-blue-900 text-white font-extrabold px-3 py-1.5 rounded-full text-sm">
                      {item.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
