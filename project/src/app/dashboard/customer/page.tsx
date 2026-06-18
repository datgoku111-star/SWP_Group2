"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Route } from "@/routers/types";
import { BedDouble, UtensilsCrossed, ArrowRight } from "lucide-react";
import type { Booking } from "@/types/hotel";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then(res => res.json())
      .then(data => {
        const myBookings = data.filter((b: Booking) => b.user_id === user?.id);
        // Find the first CHECKED_IN or CONFIRMED booking
        const active = myBookings.find((b: Booking) => ["CHECKED_IN", "CONFIRMED"].includes(b.status));
        setActiveBooking(active || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.full_name}</h1>
        <p className="text-neutral-500 mt-1">Manage your stays and services</p>
      </div>

      {!loading && activeBooking ? (
        <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-primary-900/50 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold tracking-wider mb-4">
              ACTIVE STAY
            </span>
            <h3 className="text-2xl font-bold mb-2">Room {activeBooking.room?.room_number}</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">{activeBooking.room?.room_type?.name}</p>
            
            <div className="flex gap-8 mb-8">
              <div>
                <p className="text-sm text-neutral-500">Check-in</p>
                <p className="font-semibold">{activeBooking.check_in_date}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Check-out</p>
                <p className="font-semibold">{activeBooking.check_out_date}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={"/services" as Route} className="flex items-center px-6 py-3 bg-primary-6000 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                <UtensilsCrossed className="w-5 h-5 mr-2" /> Order Service
              </Link>
              <Link href={`/bookings/${activeBooking.id}` as Route} className="flex items-center px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                View Details
              </Link>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-10 rounded-2xl text-center">
          <BedDouble className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Stays</h3>
          <p className="text-neutral-500 mb-6">Ready for your next trip? Explore our available rooms.</p>
          <Link href={"/rooms" as Route} className="inline-flex items-center px-6 py-3 bg-primary-6000 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
            Book a Room <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={"/bookings" as Route} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:shadow-md transition-shadow group">
          <h4 className="text-lg font-semibold mb-2 flex items-center justify-between">
            Booking History 
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-6000 transition-colors" />
          </h4>
          <p className="text-sm text-neutral-500">View past stays and download invoices</p>
        </Link>
        <Link href={"/account" as Route} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:shadow-md transition-shadow group">
          <h4 className="text-lg font-semibold mb-2 flex items-center justify-between">
            Profile Settings 
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-6000 transition-colors" />
          </h4>
          <p className="text-sm text-neutral-500">Update your personal information</p>
        </Link>
      </div>
    </div>
  );
}
