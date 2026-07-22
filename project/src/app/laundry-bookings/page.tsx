"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { 
  Shirt, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Truck
} from "lucide-react";

export default function CustomerLaundryBookingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [laundryBookings, setLaundryBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLaundryBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/laundry-bookings");
      if (res.ok) {
        const data = await res.json();
        setLaundryBookings(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch customer laundry bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "CUSTOMER") {
        router.push("/dashboard");
      } else {
        fetchLaundryBookings();
      }
    }
  }, [user, isLoading, router, fetchLaundryBookings]);

  const handleConfirmReady = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/laundry-bookings?id=${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          status_text: "ready_to_receive",
        }),
      });
      if (res.ok) {
        fetchLaundryBookings();
      } else {
        alert("Cập nhật trạng thái thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi gửi yêu cầu.");
    }
  };

  const getStatusBadge = (statusText: string) => {
    switch (statusText) {
      case "pending":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200">
            ⏳ Chờ Lễ tân duyệt
          </span>
        );
      case "assigned":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200">
            👤 Đã duyệt & Chờ gom đồ
          </span>
        );
      case "washing":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 animate-pulse">
            🌀 Đang mang đi giặt
          </span>
        );
      case "washed":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200">
            👕 Giặt xong (Đợi bạn sẵn sàng)
          </span>
        );
      case "ready_to_receive":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 animate-pulse">
            🚪 Sẵn sàng nhận đồ (Chờ Lễ Tân duyệt)
          </span>
        );
      case "delivering":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 animate-bounce">
            🚚 Đang trả đồ (Buồng phòng đang mang lên...)
          </span>
        );
      case "delivered":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200">
            ✅ Đã giao đồ xong
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200">
            ❌ Bị từ chối
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
            {statusText}
          </span>
        );
    }
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-semibold">Đang tải lịch sử giặt đồ của bạn...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-12 px-6 mb-24 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white flex items-center gap-3">
              <Shirt className="w-10 h-10 text-primary-6000" />
              Laundry Services (Đồ Giặt)
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Kiểm tra trạng thái giặt ủi, là sấy và báo khi bạn sẵn sàng nhận lại quần áo sạch tại phòng của mình.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/laundry-services")}
              className="px-5 py-2.5 bg-primary-6000 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              👕 Gửi giặt đồ mới
            </button>
            <button 
              onClick={fetchLaundryBookings}
              className="px-5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
            >
              🔄 Tải lại
            </button>
          </div>
        </div>

        {/* Content Section */}
        {laundryBookings.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-neutral-855 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto" />
            <p className="text-neutral-500 dark:text-neutral-450 font-medium text-lg">Bạn chưa có đơn gửi giặt quần áo nào.</p>
            <button
              onClick={() => router.push("/laundry-services")}
              className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
            >
              Gửi đồ giặt ngay <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {laundryBookings.map((booking) => {
              const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(booking.total_amount);
              const dateObj = new Date(booking.created_at);
              const formattedDate = dateObj.toLocaleDateString("vi-VN") + " " + dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

              return (
                <div 
                  key={booking.id} 
                  className="bg-white dark:bg-neutral-850 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    {/* Top line */}
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
                      <div>
                        <span className="font-extrabold text-sm text-neutral-850 dark:text-neutral-200">
                          Đơn giặt là #{booking.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-mono mt-0.5">
                          Phòng {booking.room_number || "Phòng nghỉ"} • {booking.service_type}
                        </span>
                      </div>
                      {getStatusBadge(booking.status_text)}
                    </div>

                    {/* Clothing details */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 text-xs space-y-2">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase block tracking-wider">Đồ gửi giặt:</span>
                      <div className="space-y-1.5">
                        {booking.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                            <span className="font-semibold">{item.quantity}x {item.service?.name.replace("Laundry - ", "")}</span>
                             <span className="font-mono text-neutral-500">({new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.unit_price)}/cái)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes & Date */}
                    <div className="space-y-2 text-xs">
                      {booking.customer_notes && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-neutral-750 dark:text-neutral-300 italic">
                          <strong>Ghi chú:</strong> {booking.customer_notes}
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-400 pt-1 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Gửi lúc: {formattedDate}
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          Tổng tiền: {formattedPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Button Action if washed */}
                  {booking.status_text === "washed" && (
                    <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex justify-end">
                      <button
                        onClick={() => handleConfirmReady(booking.id)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center gap-1.5 animate-pulse"
                      >
                        🚪 Tôi đang ở phòng (Sẵn sàng nhận đồ)
                      </button>
                    </div>
                  )}

                  {booking.status_text === "ready_to_receive" && (
                    <div className="pt-2 text-xs text-orange-600 dark:text-orange-400 italic font-semibold text-center w-full py-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                      ⏳ Đang chờ Lễ Tân duyệt giao đồ...
                    </div>
                  )}

                  {booking.status_text === "delivering" && (
                    <div className="pt-2 text-xs text-blue-600 dark:text-blue-400 italic font-semibold text-center w-full py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center gap-1.5 animate-pulse">
                      🚚 Buồng phòng đang mang đồ lên giao cho bạn...
                    </div>
                  )}

                  {booking.status_text === "delivered" && (
                    <div className="pt-2 text-xs text-green-600 dark:text-green-400 font-bold text-center w-full py-2 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Đã giao đồ xong & cộng nợ phòng thành công
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
