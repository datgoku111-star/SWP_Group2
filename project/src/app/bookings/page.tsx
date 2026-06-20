"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Booking } from "@/types/hotel";
import { Route } from "@/routers/types";
import { Eye, Calendar } from "lucide-react";

export default function BookingsPage() {
  const { user, isLoading } = useAuth();
  const { format } = useCurrency();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/hsrm-login?callbackUrl=/bookings" as Route);
    } else if (user) {
      fetchBookings();
    }
  }, [user, isLoading, router]);

  const fetchBookings = async () => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "CHECKED_IN":
        return "bg-green-100 text-green-800";
      case "CHECKED_OUT":
        return "bg-neutral-100 text-neutral-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading || loading) {
    return <div className="container py-20">Loading...</div>;
  }

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <h2 className="text-3xl font-semibold sm:text-4xl mb-10">
        {user?.role === "CUSTOMER" ? "My Bookings" : "All Bookings"}
      </h2>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Booking ID</th>
                <th className="px-6 py-4 font-semibold">Room</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white truncate max-w-[120px]">
                    {booking.id.split("-")[0]}...
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {booking.room?.room_type?.name || "N/A"}
                    </div>

                    <div>Room {booking.room?.room_number || "N/A"}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {booking.check_in_date}
                    </div>

                    <div className="text-xs text-neutral-400 ml-5">
                      to {booking.check_out_date}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {format(booking.total_amount || 0)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/bookings/${booking.id}` as Route}
                      className="inline-flex items-center text-primary-6000 hover:text-primary-700 font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Link>
                  </td>
                </tr>
              ))}

              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}