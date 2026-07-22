"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { 
  Car, 
  Clock, 
  Check, 
  X, 
  CheckCheck, 
  Search, 
  AlertCircle, 
  User, 
  Calendar, 
  FileText,
  CreditCard
} from "lucide-react";

export default function CarOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [carRentals, setCarRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "ACTIVE" | "COMPLETED">("ALL");

  const fetchCarRentals = useCallback(async () => {
    try {
      const res = await fetch("/api/car-bookings");
      if (res.ok) {
        const data = await res.json();
        setCarRentals(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch car rentals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
        router.push("/dashboard");
      } else {
        fetchCarRentals();
      }
    }
  }, [user, isLoading, router, fetchCarRentals]);

  const handleUpdateStatus = async (id: string, status: string, statusText: string) => {
    if (statusText === "rejected" && !confirm("Bạn có chắc chắn muốn từ chối yêu cầu thuê xe này?")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/car-bookings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, status_text: statusText }),
      });
      if (res.ok) {
        fetchCarRentals();
      } else {
        alert("Cập nhật trạng thái thất bại.");
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi cập nhật.");
    }
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-semibold">Đang tải danh sách đặt xe...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filtering
  const filteredRentals = carRentals.filter((rental) => {
    const matchesSearch = 
      (rental.booking?.room?.room_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rental.booking?.user?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rental.car_type || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeTab === "PENDING") {
      return rental.status_text === "pending";
    }
    if (activeTab === "ACTIVE") {
      return ["Wait for the vehicle in the lobby.", "waiting to return the vehicle", "return requested"].includes(rental.status_text);
    }
    if (activeTab === "COMPLETED") {
      return ["returned", "rejected"].includes(rental.status_text);
    }
    return true;
  });

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
            ❌ Bị từ chối
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
            🚗 Khách đang thuê
          </span>
        );
      case "return requested":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 animate-pulse">
            ⏳ Chờ nhận xe trả
          </span>
        );
      case "returned":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200">
            ✅ Đã hoàn tất trả xe
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

  return (
    <DashboardLayout>
      <div className="container py-12 px-6 mb-24 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white flex items-center gap-3">
              <Car className="w-10 h-10 text-primary-6000" />
              Car Rental Orders Hub
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Quản lý danh sách đặt xe tự lái của khách hàng, xác minh giấy phép lái xe và xử lý bàn giao/nhận xe.
            </p>
          </div>
          <button 
            onClick={fetchCarRentals}
            className="px-5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
          >
            🔄 Tải lại dữ liệu
          </button>
        </div>

        {/* Tab Controls and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex bg-neutral-100 dark:bg-neutral-850 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 w-fit">
            {[
              { id: "ALL", name: "Tất cả đặt xe" },
              { id: "PENDING", name: "Chờ duyệt GPLX" },
              { id: "ACTIVE", name: "Đang hoạt động" },
              { id: "COMPLETED", name: "Lịch sử trả/từ chối" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary-6000 text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-450 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tên khách, hoặc dòng xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-sm focus:ring-primary-500 focus:border-primary-500 shadow-sm"
            />
          </div>
        </div>

        {/* Grid List */}
        {filteredRentals.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-neutral-850 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-450 font-medium text-lg">Không tìm thấy yêu cầu thuê xe nào thỏa mãn điều kiện.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredRentals.map((rental) => {
              const checkInCccd = rental.booking?.guest?.id_card_number || rental.booking?.user?.id_card_number || "Chưa check-in";
              const gplxCccd = rental.gplx_cccd;
              const isMatching = checkInCccd && gplxCccd && checkInCccd.trim() === gplxCccd.trim();

              return (
                <div 
                  key={rental.id} 
                  className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    {/* Top Info line */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-black px-3.5 py-1.5 rounded-2xl text-xs">
                          🚪 Phòng {rental.booking?.room?.room_number || "P101"}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                          #{rental.id.split("-")[0].toUpperCase()}
                        </span>
                      </div>
                      {getStatusBadge(rental.status_text)}
                    </div>

                    {/* Customer & Car Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-55 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-sm">
                      <div className="space-y-1">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Khách hàng:</span>
                        <span className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-neutral-500" />
                          {rental.booking?.user?.full_name || rental.booking?.guest?.full_name || "Vô danh"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Dòng xe đặt:</span>
                        <span className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-neutral-500" />
                          {rental.car_type}
                        </span>
                      </div>
                      <div className="space-y-1 col-span-1 sm:col-span-2 border-t border-neutral-100 dark:border-neutral-800 pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Thời gian thuê:</span>
                          <span className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            {new Date(rental.pickup_date).toLocaleDateString("vi-VN")} ➔ {new Date(rental.dropoff_date).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Tổng phí dịch vụ:</span>
                          <span className="font-black text-red-600 dark:text-red-400 text-base">
                            {(rental.total_amount * 26320).toLocaleString("vi-VN")} đ
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-mono">({(rental.total_amount).toLocaleString("en-US")} USD)</span>
                        </div>
                      </div>
                    </div>

                    {/* Verify Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-neutral-200 dark:border-neutral-800 pb-3 sm:pb-0 sm:pr-4">
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400 uppercase font-black tracking-wider">💳 CCCD Lúc Check-in phòng:</span>
                        <div className="text-sm font-black font-mono text-neutral-800 dark:text-neutral-200">
                          {checkInCccd}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400 uppercase font-black tracking-wider">🪪 Số CCCD trên GPLX khai báo:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black font-mono text-neutral-800 dark:text-neutral-200">
                            {gplxCccd || "Chưa nhập"}
                          </span>
                          {checkInCccd && gplxCccd ? (
                            isMatching ? (
                              <span className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-green-200">CCCD Khớp</span>
                            ) : (
                              <span className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-200">CCCD Lệch</span>
                            )
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Driving License Image Render */}
                    {rental.gplx_image && (rental.gplx_image.startsWith("data:image/") || rental.gplx_image.startsWith("http")) ? (
                      <div className="space-y-1.5">
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 font-bold flex items-center gap-1">
                          <FileText className="w-4 h-4 text-neutral-500" />
                          Ảnh Giấy Phép Lái Xe:
                        </span>
                        <div className="relative max-w-[320px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm group cursor-pointer hover:shadow-md transition-all">
                          <img 
                            src={rental.gplx_image} 
                            alt="GPLX" 
                            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            onClick={() => {
                              const win = window.open();
                              win?.document.write(`
                                <html>
                                  <head><title>Full Image GPLX</title></head>
                                  <body style="margin:0; background:#111; display:flex; align-items:center; justify-content:center; height:100vh;">
                                    <img src="${rental.gplx_image}" style="max-width:100%; max-height:100%; object-fit:contain; box-shadow:0 10px 25px rgba(0,0,0,0.5); border-radius:8px;" />
                                  </body>
                                </html>
                              `);
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 dark:text-neutral-450 flex items-center gap-1.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <span>📂 File GPLX thủ công:</span>
                        <span className="text-primary-600 dark:text-primary-400 underline font-bold select-all cursor-pointer truncate max-w-[200px]" title={rental.gplx_image}>
                          {rental.gplx_image || "gplx_manual_upload.png"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    {rental.status_text === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(rental.id, "CANCELLED", "rejected")}
                          className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400 font-extrabold text-xs transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(rental.id, "IN_PROGRESS", "Wait for the vehicle in the lobby.")}
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Duyệt GPLX & Chờ giao xe
                        </button>
                      </>
                    )}

                    {rental.status_text === "Wait for the vehicle in the lobby." && (
                      <button
                        onClick={() => handleUpdateStatus(rental.id, "IN_PROGRESS", "waiting to return the vehicle")}
                        className="px-5 py-2.5 bg-primary-6000 hover:bg-primary-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Car className="w-4 h-4" /> Bàn giao xe cho Khách hàng
                      </button>
                    )}

                    {rental.status_text === "return requested" && (
                      <button
                        onClick={() => handleUpdateStatus(rental.id, "COMPLETED", "returned")}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4" /> Nhận xe & Ghi nợ phòng
                      </button>
                    )}

                    {rental.status_text === "waiting to return the vehicle" && (
                      <span className="text-xs text-neutral-400 font-medium italic">Khách đang thuê. Đợi yêu cầu trả xe từ phía khách hàng...</span>
                    )}

                    {rental.status_text === "returned" && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4" /> Đã trả xe thành công
                      </span>
                    )}

                    {rental.status_text === "rejected" && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                        Bị từ chối (CCCD không khớp)
                      </span>
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
