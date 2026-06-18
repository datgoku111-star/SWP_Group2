"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  User, 
  Search, 
  Check, 
  X, 
  Clock, 
  DollarSign 
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";

interface Booking {
  id: string;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
  created_at?: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackBookings: Booking[] = [
    {
      id: "b-1",
      guest_name: "Nguyễn Văn A",
      room_number: "Deluxe 101",
      check_in_date: "2026-06-20",
      check_out_date: "2026-06-23",
      total_amount: 2250000,
      status: "CONFIRMED" // Đã thanh toán
    },
    {
      id: "b-2",
      guest_name: "Trần Thị B",
      room_number: "Suite 203",
      check_in_date: "2026-06-25",
      check_out_date: "2026-06-28",
      total_amount: 3750000,
      status: "PENDING" // Chờ thanh toán
    },
    {
      id: "b-3",
      guest_name: "Phạm Minh C",
      room_number: "Standard 102",
      check_in_date: "2026-06-15",
      check_out_date: "2026-06-17",
      total_amount: 1000000,
      status: "CANCELLED" // Đã hủy
    }
  ];

  // Fetch bookings from database
  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch bookings joined with user/guest if possible, else fetch list
      const { data, error } = await supabaseBrowser
        .from("bookings")
        .select(`
          id,
          check_in_date,
          check_out_date,
          total_amount,
          status,
          user:users(full_name),
          room:rooms(room_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Booking[] = data.map((b: any) => ({
          id: b.id,
          guest_name: b.user?.full_name || "Khách ẩn danh",
          room_number: b.room?.room_number || "Chưa chọn phòng",
          check_in_date: b.check_in_date,
          check_out_date: b.check_out_date,
          total_amount: Number(b.total_amount || 0),
          status: b.status === "CONFIRMED" || b.status === "CHECKED_IN" || b.status === "CHECKED_OUT"
            ? "CONFIRMED" 
            : b.status === "CANCELLED" 
              ? "CANCELLED" 
              : "PENDING"
        }));
        setBookings(mapped);
      } else {
        setBookings(fallbackBookings);
      }
    } catch (err) {
      console.warn("Could not fetch bookings from Supabase, using mock fallback. Details:", err);
      setBookings(fallbackBookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update Booking Status
  const handleUpdateStatus = async (id: string, newStatus: "CONFIRMED" | "PENDING" | "CANCELLED") => {
    try {
      if (id.startsWith("b-")) {
        // Mock data state update
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
      } else {
        // Supabase DB update
        const dbStatusMap = {
          CONFIRMED: "CONFIRMED",
          PENDING: "PENDING",
          CANCELLED: "CANCELLED"
        };
        const { error } = await supabaseBrowser
          .from("bookings")
          .update({ status: dbStatusMap[newStatus] })
          .eq("id", id);

        if (error) throw error;
        await fetchBookings();
      }
    } catch (err: any) {
      alert("Lỗi cập nhật trạng thái đơn đặt phòng: " + err.message);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.room_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status Badge Renderer
  const renderStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <Check className="w-3.5 h-3.5 mr-1" />
            Đã thanh toán
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Chờ thanh toán
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <X className="w-3.5 h-3.5 mr-1" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
          Quản Lý Đơn Đặt Phòng
        </h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Xem thông tin khách hàng, phòng đặt, thời gian lưu trú và cập nhật trạng thái đơn.
        </p>
      </div>

      {/* Control Bar (Search) */}
      <div className="flex bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 items-center justify-between">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên khách hoặc số phòng..."
            className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Khách Hàng</th>
                <th scope="col" className="px-6 py-4">Phòng Đặt</th>
                <th scope="col" className="px-6 py-4">Thời Gian Lưu Trú</th>
                <th scope="col" className="px-6 py-4">Tổng Tiền</th>
                <th scope="col" className="px-6 py-4">Trạng Thái</th>
                <th scope="col" className="px-6 py-4 text-right">Cập Nhật Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-500 dark:text-neutral-400 font-medium">
                    Không tìm thấy đơn đặt phòng nào.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 font-bold text-neutral-900 dark:text-white">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>{booking.guest_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-neutral-700 dark:text-neutral-300">
                      {booking.room_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-medium">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>{booking.check_in_date}</span>
                        <span className="text-neutral-300 mx-1">→</span>
                        <span>{booking.check_out_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-neutral-900 dark:text-white">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {booking.status !== "CONFIRMED" && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                            className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                            title="Xác nhận đã thanh toán"
                          >
                            Xác nhận
                          </button>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "PENDING")}
                            className="px-3 py-1.5 text-xs font-semibold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
                            title="Đánh dấu chờ thanh toán"
                          >
                            Chờ
                          </button>
                        )}
                        {booking.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                            title="Hủy đơn đặt"
                          >
                            Hủy đơn
                          </button>
                        )}
                      </div>
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
