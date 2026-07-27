"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import DashboardLayout from "../dashboard/layout";
import Link from "next/link";
import type { Booking } from "@/types/hotel";
import { Route } from "@/routers/types";
import { Eye, Calendar, User as UserIcon, Search, ArrowRight, RefreshCw, Filter, CreditCard, Users, Car } from "lucide-react";
import { useTranslation } from "react-i18next";
import Input from "@/shared/Input";
import { Dialog, Transition } from "@headlessui/react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonSecondary from "@/shared/ButtonSecondary";
import { XCircle } from "lucide-react";

export default function BookingsPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const [carLoading, setCarLoading] = useState(false);

  const handleReturnVehicle = async (cbId: string) => {
    if (!confirm("Bạn muốn yêu cầu trả chiếc xe này?")) return;
    try {
      const res = await fetch(`/api/car-bookings?id=${cbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          status_text: "return requested",
        }),
      });
      if (res.ok) {
        alert("✅ Yêu cầu trả xe đã được gửi tới Lễ tân!");
        } else {
        alert("Gửi yêu cầu trả xe thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi.");
    }
  };

  // Filters
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Confirm State
  const [isConfirming, setIsConfirming] = useState<string | null>(null);

  const [cancelReason, setCancelReason] = useState("");

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
        let filtered = data.filter((b: any) => {
          if (b.special_requests) {
            try {
              const meta = JSON.parse(b.special_requests);
              if (meta?.isExperience || meta?.isCar) return false;
            } catch(e) {}
          }
          return true;
        });
        if (user?.role === "CUSTOMER") {
          filtered = filtered.filter((b: any) => b.user_id === user.id);
        }
        setBookings(filtered);
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
        let filtered = Array.isArray(data) ? data : [];
        filtered = filtered.filter((b: any) => {
          if (b.special_requests) {
            try {
              const meta = JSON.parse(b.special_requests);
              if (meta?.isExperience || meta?.isCar) return false;
            } catch(e) {}
          }
          return true;
        });
        if (user?.role === "CUSTOMER") {
          filtered = filtered.filter((b: any) => b.user_id === user.id);
        }
        setBookings(filtered);
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

  const isStaff = ["ADMIN", "RECEPTIONIST"].includes(user?.role || "");

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    if (isStaff && !cancelReason.trim()) {
      alert("Please enter a cancellation reason.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${bookingToCancel.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        setCancelModalOpen(false);
        setBookingToCancel(null);
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to cancel booking.");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("An error occurred while cancelling the booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    setIsConfirming(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to confirm booking.");
      }
    } catch (err) {
      console.error("Confirm error:", err);
      alert("An error occurred while confirming.");
    } finally {
      setIsConfirming(null);
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

  return (
    <DashboardLayout>
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
              ) : (                bookings.map((booking) => {
                  // Parse booking type
                  let isExp = false;
                  let isCar = false;
                  let meta: any = null;
                  let cancelReasonText = null;
                  
                  if (booking.special_requests) {
                    try {
                      meta = JSON.parse(booking.special_requests);
                      if (meta) {
                        if (meta.isExperience) isExp = true;
                        if (meta.isCar) isCar = true;
                      }
                    } catch (e) {}
                    
                    const match = booking.special_requests.match(/\[CANCEL_REASON:\s*(.*?)\]/);
                    if (match && match[1]) {
                      cancelReasonText = match[1];
                    }
                  }

                  const isUSD = isExp || isCar;
                  const displayPrice = isUSD 
                    ? `$${Number(booking.total_amount).toFixed(2)}` 
                    : formatMoney(booking.total_amount);

                  return (
                    <tr key={booking.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-white">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{booking.id.split("-")[0].toUpperCase()}</span>
                          {isExp && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Trải nghiệm
                            </span>
                          )}
                          {isCar && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Thuê xe
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isExp ? (
                          <>
                            <div className="font-extrabold text-neutral-900 dark:text-white capitalize">
                              🧗 {meta?.title || "Tour Trải nghiệm"}
                            </div>
                            <div className="text-xs text-neutral-500">Dịch vụ hoạt động trải nghiệm</div>
                          </>
                        ) : isCar ? (
                          <>
                            <div className="font-extrabold text-neutral-900 dark:text-white">
                              🚗 {meta?.title || "Thuê xe"}
                            </div>
                            <div className="text-xs text-neutral-500">Dịch vụ phương tiện tự lái</div>
                          </>
                        ) : (
                          <>
                            <div className="font-extrabold text-neutral-900 dark:text-white">
                              Room {booking.room?.room_number}
                            </div>
                            <div className="text-xs text-neutral-500">{booking.room?.room_type?.name}</div>
                          </>
                        )}
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
                        {booking.status === "CANCELLED" && cancelReasonText && (
                          <div className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-medium italic break-words max-w-[150px]">
                            Lý do: {cancelReasonText}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-neutral-900 dark:text-white">
                        {displayPrice}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {isStaff && booking.status === "PENDING" && (
                          <button
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={isConfirming === booking.id}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                          >
                            <span>{isConfirming === booking.id ? "Confirming..." : "Confirm Booking"}</span>
                          </button>
                        )}
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
                      {(booking.status === "PENDING" || (!isStaff && booking.status === "CONFIRMED")) && (
                        <button
                          onClick={() => {
                            setBookingToCancel(booking);
                            setCancelModalOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-semibold text-xs transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel booking
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>


      </div>

      {/* CANCEL MODAL */}
      <Transition appear show={cancelModalOpen} as={React.Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => !isCancelling && setCancelModalOpen(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-40" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-neutral-900 shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Confirm Cancellation
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                  Are you sure you want to cancel booking{" "}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {bookingToCancel?.id.split("-")[0].toUpperCase()}
                  </span>
                  ?
                  {isStaff ? (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl font-medium text-left">
                      Note: The deposit will be refunded to the customer.
                      <textarea
                        className="w-full mt-3 p-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-neutral-900 text-sm font-normal text-neutral-700 dark:text-neutral-300"
                        placeholder="Enter cancellation reason..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl font-medium">
                      Note: Canceling the booking will result in the loss of your 10% deposit (
                      <span className="font-bold">{formatMoney((bookingToCancel?.total_amount || 0) * 0.1)}</span>
                      ). This action cannot be undone.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <ButtonSecondary onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
                    No, keep it
                  </ButtonSecondary>
                  <ButtonPrimary onClick={handleCancelBooking} loading={isCancelling} className="bg-red-600 hover:bg-red-700">
                    Yes, cancel
                  </ButtonPrimary>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

    </DashboardLayout>
  );
}
