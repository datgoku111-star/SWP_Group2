"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import type { DashboardStats } from "@/types/hotel";
import {
  BedDouble,
  Users,
  CreditCard,
  UtensilsCrossed,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { format } = useCurrency();

  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((res) => res.json())
      .then((data) => setStats(data.stats))
      .catch(console.error);
  }, []);

  if (!stats) {
    return <div className="p-8">Loading stats...</div>;
  }

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>

          <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {value}
          </h4>
        </div>

        <div className={`p-4 rounded-full ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>

        <p className="text-neutral-500 mt-1">
          Welcome back, {user?.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={format(Number(stats.revenue_today || 0))}
          icon={CreditCard}
          colorClass="bg-green-100 text-green-600"
        />

        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancy_rate}%`}
          icon={TrendingUp}
          colorClass="bg-primary-100 text-primary-6000"
        />

        <StatCard
          title="Pending Orders"
          value={stats.pending_orders}
          icon={UtensilsCrossed}
          colorClass="bg-amber-100 text-amber-600"
        />

        <StatCard
          title="Available Rooms"
          value={`${stats.available_rooms} / ${stats.total_rooms}`}
          icon={BedDouble}
          colorClass="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Front Desk Today</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-blue-500" />

                <span className="font-medium">Expected Arrivals</span>
              </div>

              <span className="text-xl font-bold">
                {stats.todays_arrivals}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-amber-500" />

                <span className="font-medium">Expected Departures</span>
              </div>

              <span className="text-xl font-bold">
                {stats.todays_departures}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/rooms"
              className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors"
            >
              Manage Rooms
            </a>

            <a
              href="/admin/services"
              className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors"
            >
              Manage Services
            </a>

            <a
              href="/admin/users"
              className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors"
            >
              User Access
            </a>

            <a
              href="/admin/reports"
              className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors"
            >
              Full Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}