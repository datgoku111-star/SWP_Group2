"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "../dashboard/layout";
import { useRouter } from "next/navigation";
import { 
  Shirt, 
  Clock, 
  Check, 
  X, 
  Search, 
  AlertCircle, 
  User, 
  Calendar, 
  Clipboard,
  HelpCircle,
  Truck
} from "lucide-react";

export default function LaundryOrdersHubPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [laundryOrders, setLaundryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "ACTIVE" | "COMPLETED">("ALL");

  const fetchLaundryOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/laundry-bookings");
      if (res.ok) {
        const data = await res.json();
        setLaundryOrders(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch laundry orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !["ADMIN", "RECEPTIONIST", "HOUSEKEEPING"].includes(user.role)) {
        router.push("/dashboard");
      } else {
        fetchLaundryOrders();
      }
    }
  }, [user, isLoading, router, fetchLaundryOrders]);

  const handleUpdateStatus = async (id: string, status: string, statusText: string) => {
    if (statusText === "rejected" && !confirm("Bạn có chắc chắn muốn từ chối đơn hàng giặt là này?")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/laundry-bookings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, status_text: statusText }),
      });
      if (res.ok) {
        fetchLaundryOrders();
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
          <p className="text-neutral-500 font-semibold">Đang tải danh sách đơn giặt là...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Lọc dữ liệu
  const filteredOrders = laundryOrders.filter((order) => {
    const matchesSearch = 
      (order.room_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.booking?.user?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.service_type || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeTab === "PENDING") {
      return order.status_text === "pending";
    }
    if (activeTab === "ACTIVE") {
      return ["assigned", "washing", "washed", "ready_to_receive", "delivering"].includes(order.status_text);
    }
    if (activeTab === "COMPLETED") {
      return ["delivered", "rejected"].includes(order.status_text);
    }
    return true;
  });

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
            👤 Đã giao Buồng phòng
          </span>
        );
      case "washing":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 animate-pulse">
            🌀 Đang giặt đồ
          </span>
        );
      case "washed":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200">
            👕 Đã giặt xong & Chờ giao
          </span>
        );
      case "ready_to_receive":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 animate-pulse">
            🚪 Khách ở phòng (Sẵn sàng nhận đồ)
          </span>
        );
      case "delivering":
        return (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 animate-bounce">
            🚚 Đang trả đồ
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

  return (
    <DashboardLayout>
      <div className="container py-12 px-6 mb-24 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white flex items-center gap-3">
              <Shirt className="w-10 h-10 text-primary-6000" />
              Laundry Orders Hub
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Quản lý danh sách đơn giặt là của khách hàng, duyệt chuyển tiếp công việc cho buồng phòng và theo dõi tiến độ.
            </p>
          </div>
          <button 
            onClick={fetchLaundryOrders}
            className="px-5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
          >
            🔄 Tải lại dữ liệu
          </button>
        </div>

        {/* Tab Controls and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex bg-neutral-100 dark:bg-neutral-850 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 w-fit">
            {[
              { id: "ALL", name: "Tất cả đơn" },
              { id: "PENDING", name: "Chờ Lễ Tân duyệt" },
              { id: "ACTIVE", name: "Đang xử lý (Buồng phòng)" },
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
              placeholder="Tìm theo số phòng, tên khách, loại dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-sm focus:ring-primary-500 focus:border-primary-500 shadow-sm"
            />
          </div>
        </div>

        {/* Grid List */}
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-neutral-850 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-450 font-medium text-lg">Không tìm thấy yêu cầu giặt đồ nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const formattedPrice = order.total_amount.toLocaleString("vi-VN") + " đ";
              const formattedDate = new Date(order.created_at).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              });

              return (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    {/* Top Info line */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-black px-3.5 py-1.5 rounded-2xl text-xs">
                          🚪 Phòng {order.room_number || "P101"}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                          #{order.id.split("-")[0].toUpperCase()}
                        </span>
                      </div>
                      {getStatusBadge(order.status_text)}
                    </div>

                    {/* Customer & Order details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-sm">
                      <div className="space-y-1">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Khách hàng:</span>
                        <span className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-neutral-500" />
                          {order.booking?.user?.full_name || order.booking?.guest?.full_name || "Vô danh"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Loại hình giặt:</span>
                        <span className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <Shirt className="w-4 h-4 text-neutral-500" />
                          {order.service_type === "Wash & Fold" ? "Giặt thường (Wash & Fold)" : 
                           order.service_type === "Dry Cleaning" ? "Giặt khô / Giặt hấp" : "Chỉ ủi / là (Pressing Only)"}
                        </span>
                      </div>
                      <div className="space-y-1 col-span-1 sm:col-span-2 border-t border-neutral-100 dark:border-neutral-800 pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Thời gian đặt:</span>
                          <span className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            {formattedDate}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs uppercase block">Tổng phí dịch vụ:</span>
                          <span className="font-black text-red-600 dark:text-red-400 text-base">
                            {formattedPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clothing Items list */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-2">
                      <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block">Danh sách quần áo:</span>
                      <div className="space-y-1.5">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-neutral-700 dark:text-neutral-300">
                            <span className="font-semibold">{item.quantity}x {item.service?.name.replace("Laundry - ", "")}</span>
                            <span className="font-mono text-neutral-500">({item.unit_price.toLocaleString("vi-VN")} đ/món)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Notes */}
                    {order.customer_notes && (
                      <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                        <Clipboard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-800 dark:text-amber-400">Ghi chú của khách:</strong> {order.customer_notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 w-full">
                    {user?.role === "HOUSEKEEPING" ? (
                      // Housekeeping Actions View
                      <>
                        {order.status_text === "pending" && (
                          <span className="text-xs text-neutral-500 italic">⏳ Chờ Lễ tân duyệt đơn...</span>
                        )}

                        {order.status_text === "assigned" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "PENDING", "washing")}
                            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl font-extrabold text-xs transition-all"
                          >
                            🌀 Nhận đồ và đang giặt
                          </button>
                        )}

                        {order.status_text === "washing" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "PENDING", "washed")}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow transition-all"
                          >
                            👕 Đã giặt xong & Sẵn sàng giao
                          </button>
                        )}

                        {order.status_text === "washed" && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-450 italic flex items-center gap-1.5">
                            ⏳ Đã giặt sạch. Đang đợi Khách hàng báo sẵn sàng ở phòng để giao đồ...
                          </span>
                        )}

                        {order.status_text === "ready_to_receive" && (
                          <span className="text-xs text-neutral-500 italic">⏳ Chờ Lễ tân duyệt giao đồ...</span>
                        )}

                        {order.status_text === "delivering" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "COMPLETED", "delivered")}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow transition-all flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" /> Đã giao đồ xong
                          </button>
                        )}

                        {order.status_text === "delivered" && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                            ✅ Đã giao đồ xong & cộng nợ phòng thành công
                          </span>
                        )}

                        {order.status_text === "rejected" && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                            Đơn đã bị từ chối
                          </span>
                        )}
                      </>
                    ) : (
                      // Receptionist / Admin Actions View
                      <>
                        {order.status_text === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "CANCELLED", "rejected")}
                              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-red-600 dark:text-red-450 font-extrabold text-xs transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Từ chối
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "PENDING", "assigned")}
                              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" /> Duyệt đơn & Giao buồng phòng
                            </button>
                          </>
                        )}

                        {order.status_text === "assigned" && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-450 italic flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-purple-500 animate-spin" /> Đã giao việc. Chờ buồng phòng lên nhận đồ tại phòng {order.room_number}...
                          </span>
                        )}

                        {order.status_text === "washing" && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-500 animate-spin" /> Buồng phòng đang giặt đồ cho khách...
                          </span>
                        )}

                        {order.status_text === "washed" && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-indigo-500" /> Đã giặt xong. Đang chờ khách hàng xác nhận ở phòng sẵn sàng nhận đồ...
                          </span>
                        )}

                        {order.status_text === "ready_to_receive" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "PENDING", "delivering")}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Xác nhận giao đồ
                          </button>
                        )}

                        {order.status_text === "delivering" && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 animate-pulse">
                            🚚 Buồng phòng đang mang trả đồ...
                          </span>
                        )}

                        {order.status_text === "delivered" && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5">
                            ✅ Đã giao đồ xong & cộng nợ phòng thành công
                          </span>
                        )}

                        {order.status_text === "rejected" && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                            Đơn đã bị từ chối
                          </span>
                        )}
                      </>
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
