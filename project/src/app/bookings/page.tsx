"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Booking } from "@/types/hotel";
import { Route } from "@/routers/types";
import { Eye, Calendar, User as UserIcon, Search, ArrowRight, RefreshCw, Filter, CreditCard, Users } from "lucide-react";
import Input from "@/shared/Input";

export default function BookingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/hsrm-login?callbackUrl=/bookings" as Route);
    } else if (user) {
      fetchBookings();
    }
  }, [user, isLoading, router]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        if (user?.role === "CUSTOMER") {
          setBookings(data.filter((b: Booking) => b.user_id === user.id));
        } else {
          setBookings(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, status: string) => {
    setIsSearching(true);
    try {
      let url = `/api/bookings/search?query=${encodeURIComponent(query.trim())}`;
      if (status && status !== "ALL") {
        url += `&status=${status}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusTab(newStatus);
    if (searchKeyword.trim() || newStatus !== "ALL") {
      handleSearch(searchKeyword, newStatus);
    } else {
      fetchBookings();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim() || statusTab !== "ALL") {
      handleSearch(searchKeyword, statusTab);
    } else {
      fetchBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200";
      case "CHECKED_IN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200";
      case "CHECKED_OUT":
        return "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

  if (isLoading || loading) {
    return (
      <div className="container py-20 text-center">
        <div className="w-8 h-8 border-4 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500 font-medium">Loading Reservations Database...</p>
      </div>
    );
  }

  const isStaff = ["ADMIN", "RECEPTIONIST"].includes(user?.role || "");

  return (
    <div className="container py-12 mb-24 lg:mb-32 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white">
            {user?.role === "CUSTOMER" ? "My Bookings" : "Reservations & Billing Management"}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {isStaff
              ? "Filter all reservations across statuses, check-in guests, perform check-out & print invoices."
              : "Review your upcoming and past stays with Chisfis."}
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-3">
            <Link
              href="/checkin?mode=walkin"
              className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>➕ Instant Walk-In Booking</span>
            </Link>
            <Link
              href="/checkin"
              className="px-4 py-2.5 rounded-xl bg-primary-6000 hover:bg-primary-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Check-In / Check-Out Desk</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl">
            {[
              { id: "ALL", label: "All Statuses" },
              { id: "CONFIRMED", label: "Confirmed (Arriving)" },
              { id: "CHECKED_IN", label: "Checked In (Staying)" },
              { id: "CHECKED_OUT", label: "Checked Out (Departed)" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusTab === tab.id
                    ? "bg-white dark:bg-neutral-900 text-primary-6000 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto min-w-[320px]">
            <div className="relative flex-grow">
              <Input
                placeholder="Search Booking ID, Guest Name, Room..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-4 h-10 bg-primary-6000 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-extrabold">Booking ID</th>
                <th className="px-6 py-4 font-extrabold">Room</th>
                <th className="px-6 py-4 font-extrabold">Guest Info</th>
                <th className="px-6 py-4 font-extrabold">Dates</th>
                <th className="px-6 py-4 font-extrabold">Status</th>
                <th className="px-6 py-4 font-extrabold">Total Amount</th>
                <th className="px-6 py-4 font-extrabold text-right">Quick Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-neutral-400">
                    No reservations found matching your current filter or search criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-white">
                      {booking.id.split("-")[0].toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-neutral-900 dark:text-white">
                        Room {booking.room?.room_number}
                      </div>
                      <div className="text-xs text-neutral-500">{booking.room?.room_type?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{booking.user?.full_name || booking.guest?.full_name || "Guest"}</span>
                      </div>
                      {booking.user?.phone && (
                        <div className="text-xs text-neutral-400 font-mono mt-0.5">{booking.user.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-200">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{booking.check_in_date}</span>
                      </div>
                      <div className="text-xs text-neutral-400 ml-5">&rarr; {booking.check_out_date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-neutral-900 dark:text-white">
                      {formatMoney(booking.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {isStaff && (booking.status === "CONFIRMED" || booking.status === "PENDING") && (
                        <Link
                          href={`/checkin?bookingId=${booking.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl bg-primary-6000 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          <span>Check-In</span>
                        </Link>
                      )}
                      {isStaff && booking.status === "CHECKED_IN" && (
                        <Link
                          href={`/checkin?bookingId=${booking.id}&mode=checkout`}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          <span>Settle / Check-Out</span>
                        </Link>
                      )}
                      <Link
                        href={`/bookings/${booking.id}` as Route}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
