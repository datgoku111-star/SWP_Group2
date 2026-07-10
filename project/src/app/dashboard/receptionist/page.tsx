"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { CalendarCheck, Users, Search, CreditCard } from "lucide-react";

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Reusing the admin report endpoint since receptionists share some stats
    fetch("/api/admin/reports")
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Front Desk Operations</h1>
        <p className="text-neutral-500 mt-1">Hello, {user?.full_name}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Available Rooms</p>
              <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.available_rooms}</h4>
            </div>
            <div className="p-4 rounded-full bg-green-100 text-green-600"><CalendarCheck className="w-6 h-6" /></div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Today's Arrivals</p>
              <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.todays_arrivals}</h4>
            </div>
            <div className="p-4 rounded-full bg-blue-100 text-blue-600"><Users className="w-6 h-6" /></div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Today's Departures</p>
              <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.todays_departures}</h4>
            </div>
            <div className="p-4 rounded-full bg-amber-100 text-amber-600"><CreditCard className="w-6 h-6" /></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-6">Quick Tasks</h3>
          <div className="space-y-4">
            <Link href="/checkin" className="flex items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div className="p-3 bg-white dark:bg-neutral-700 rounded-lg shadow-sm mr-4 text-primary-6000"><Search className="w-5 h-5" /></div>
              <div>
                <h4 className="font-semibold">Check-in Guest</h4>
                <p className="text-sm text-neutral-500">Scan ID and assign room</p>
              </div>
            </Link>
            
            <Link href="/bookings" className="flex items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div className="p-3 bg-white dark:bg-neutral-700 rounded-lg shadow-sm mr-4 text-green-600"><CreditCard className="w-5 h-5" /></div>
              <div>
                <h4 className="font-semibold">Checkout & Invoice</h4>
                <p className="text-sm text-neutral-500">Process payments for departures</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
  
}
