"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { 
  Car, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";

export default function CustomerCarBookingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [carBookings, setCarBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCarBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/car-bookings");
      if (res.ok) {
        const data = await res.json();
        setCarBookings(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch customer car bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "CUSTOMER") {
        router.push("/dashboard");
      } else {
        fetchCarBookings();
      }
    }
  }, [user, isLoading, router, fetchCarBookings]);

  const handleReturnVehicle = async (cbId: string) => {
    if (!confirm("Bạn muốn xác nhận yêu cầu trả chiếc xe này?")) return;
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
        fetchCarBookings();
      } else {
        alert("Yêu cầu trả xe thất bại.");
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
            ⏳ Chờ duyệt GPLX
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200">
            ❌ Bị từ chối (CCCD không khớp)
          </span>
        );
      case "Wait for the vehicle in the lobby.":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200">
            🔔 Chờ nhận xe ở sảnh
          </span>
        );
      case "waiting to return the vehicle":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200">
            🚗 Đang sử dụng xe
          </span>
        );
      case "return requested":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200">
            ⏳ Đang chờ bàn giao xe trả
          </span>
        );
      case "returned":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200">
            ✅ Đã trả xe thành công
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
          <p className="text-neutral-500 font-semibold">Đang tải danh sách đặt xe của bạn...</p>
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
              <Car className="w-10 h-10 text-primary-6000" />
              Lịch sử Thuê xe tự lái
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Xem và kiểm soát trạng thái các lượt thuê xe tự lái kết nối với kỳ nghỉ dưỡng của bạn.
            </p>
          </div>
          <button 
            onClick={fetchCarBookings}
            className="px-5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
          >
            🔄 Tải lại
          </button>
        </div>

        {/* Info Helper alert */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-3xl text-sm flex gap-3 text-blue-800 dark:text-blue-300">
          <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Quy trình bàn giao & Trả xe tự lái:</p>
            <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <li>Đăng ký thuê xe tự lái và gửi ảnh GPLX đối chiếu CCCD check-in.</li>
              <li>Lễ tân duyệt GPLX và chuẩn bị xe, quý khách vui lòng xuống sảnh nhận chìa khóa khi trạng thái chuyển sang <strong className="text-amber-700 dark:text-amber-400">Chờ nhận xe ở sảnh</strong>.</li>
              <li>Sau khi kết thúc hành trình, hãy chọn <strong className="text-primary-600">Yêu cầu trả xe</strong> ở danh sách bên dưới rồi bàn giao lại chìa khóa cho Lễ tân để thanh toán cộng dồn vào hóa đơn phòng khi check-out.</li>
            </ul>
          </div>
        </div>

        {/* Grid List */}
        {carBookings.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-neutral-850 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-450 font-medium text-lg">Bạn chưa đăng ký sử dụng dịch vụ thuê xe nào.</p>
            <button 
              onClick={() => router.push("/services")}
              className="mt-4 px-5 py-2.5 bg-primary-6000 text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-700 transition-all flex items-center gap-1.5 mx-auto"
            >
              Đặt dịch vụ ngay <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {carBookings.map((cb) => {
              const formattedPrice = (cb.total_amount * 26320).toLocaleString("vi-VN") + " đ";
              return (
                <div 
                  key={cb.id} 
                  className="bg-white dark:bg-neutral-850 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    {/* Top line info */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-bold px-3 py-1 rounded-xl text-xs">
                        🚪 Phòng {cb.booking?.room?.room_number || "P-VIP"}
                      </span>
                      {getStatusBadge(cb.status_text)}
                    </div>

                    {/* Car Title */}
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Car className="w-5 h-5 text-neutral-500" />
                        {cb.car_type}
                      </h3>
                      <p className="text-xs text-neutral-400">Mã đơn đặt xe: #{cb.id.split("-")[0].toUpperCase()}</p>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2 text-sm pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Thời gian thuê:</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {new Date(cb.pickup_date).toLocaleDateString("vi-VN")} ➔ {new Date(cb.dropoff_date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">CCCD Đăng ký:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {cb.gplx_cccd}
                        </span>
                      </div>
                      
                      {/* Price Section */}
                      <div className="flex justify-between items-center border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-2 mt-2">
                        <span className="text-neutral-450 font-bold">Tổng chi phí thuê:</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-primary-600 dark:text-primary-400 block">
                            {formattedPrice}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block">({cb.total_amount} USD)</span>
                        </div>
                      </div>
                    </div>

                    {/* GPLX Image Render */}
                    {cb.gplx_image && (cb.gplx_image.startsWith("data:image/") || cb.gplx_image.startsWith("http")) && (
                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block">📂 Ảnh GPLX đã gửi đối chiếu:</span>
                        <div className="relative max-w-[200px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm">
                          <img 
                            src={cb.gplx_image} 
                            alt="GPLX" 
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {cb.status_text === "waiting to return the vehicle" ? (
                      <button
                        onClick={() => handleReturnVehicle(cb.id)}
                        className="px-5 py-2.5 bg-primary-6000 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        🚗 Yêu cầu trả xe (Request Return)
                      </button>
                    ) : cb.status_text === "return requested" ? (
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-bold italic animate-pulse">
                        ⏳ Đang chờ lễ tân nhận bàn giao chìa khóa...
                      </span>
                    ) : cb.status_text === "returned" ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất & cộng vào hóa đơn phòng
                      </span>
                    ) : cb.status_text === "rejected" ? (
                      <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                        Yêu cầu bị từ chối
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 font-medium italic">Đang chờ lễ tân duyệt hồ sơ...</span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
