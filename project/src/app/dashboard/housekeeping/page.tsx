"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Layers, ShieldAlert, Wrench, Check, ArrowRight, BedDouble, Clock, CheckCheck, Plus, ClipboardList, Shirt, Truck, SprayCan, Zap } from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translateService } from "@/utils/laundry";

export interface RoomTurnover {
  id: string;
  room_number: string;
  floor: number;
  status: "AVAILABLE" | "IN_USE" | "DIRTY" | "CLEANING" | "MAINTENANCE";
  notes?: string;
  room_type?: {
    name: string;
  };
  last_cleaned?: string;
}

export default function HousekeepingDashboardHub() {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === "vn";
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeWorkflow, setActiveWorkflow] = useState<"DIRTY_FLOW" | "MAINTENANCE_FLOW" | "IN_USE_FLOW" | "AVAILABLE_FLOW" | "LAUNDRY_FLOW" | "CHECKOUT_FLOW">("DIRTY_FLOW");
    const [checkoutRequests, setCheckoutRequests] = useState<any[]>([]);
  const [reportingRoomId, setReportingRoomId] = useState<string | null>(null);
  const [selectedDamages, setSelectedDamages] = useState<{name: string, price: number}[]>([]);
  const [customDamageName, setCustomDamageName] = useState("");
  const [customDamagePrice, setCustomDamagePrice] = useState("");
  const [isSubmittingDamage, setIsSubmittingDamage] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);
  const [damageNote, setDamageNote] = useState("");
  const [damageImage, setDamageImage] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/incidents?active=true");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch active incidents:", e);
    }
  };

  const handleToggleDamage = (damage: {name: string, price: number}) => {
    setSelectedDamages(prev => 
      prev.find(d => d.name === damage.name) 
        ? prev.filter(d => d.name !== damage.name)
        : [...prev, damage]
    );
  };
  const [rooms, setRooms] = useState<RoomTurnover[]>([]);
  const [loading, setLoading] = useState(true);
  const [laundryOrders, setLaundryOrders] = useState<any[]>([]);
  const [laundryLoading, setLaundryLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      fetchIncidents();
      const res = await fetch("/api/rooms?all=true");
      const coRes = await fetch("/api/housekeeping/checkout-requests");
      
      if (coRes.ok) {
        const coData = await coRes.json();
        setCheckoutRequests(coData);
      }

      if (!res.ok) throw new Error("Không thể tải trạng thái buồng phòng");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data);
      } else {
        // Fallback realistic active demo dataset covering all 4 workflows cleanly
        setRooms([
          { id: "r-101", room_number: "P101", floor: 1, status: "DIRTY", notes: "Khách vừa Check-out lúc 12:00, cần dọn tổng vệ sinh & thay ga giường", room_type: { name: "Deluxe Ocean View" }, last_cleaned: "Hôm qua" },
          { id: "r-102", room_number: "P102", floor: 1, status: "AVAILABLE", room_type: { name: "Standard Garden" }, last_cleaned: "10:30 Sáng nay" },
          { id: "r-201", room_number: "P201", floor: 2, status: "DIRTY", notes: "Khách VIP nhận phòng lúc 14:00 (Ưu tiên gấp số 1)", room_type: { name: "Suite Premium" }, last_cleaned: "Hôm qua" },
          { id: "r-202", room_number: "P202", floor: 2, status: "IN_USE", notes: "Khách yêu cầu dọn phòng lúc 15:00 & thêm 2 chai nước khoáng", room_type: { name: "Family King" }, last_cleaned: "Hôm qua" },
          { id: "r-301", room_number: "P301", floor: 3, status: "MAINTENANCE", notes: "Vòi hoa sen nhà tắm bị rò rỉ nước, thợ điện nước đang kiểm tra", room_type: { name: "Presidential Suite" }, last_cleaned: "3 ngày trước" },
          { id: "r-302", room_number: "P302", floor: 3, status: "MAINTENANCE", notes: "Điều hòa kêu to lúc ban đêm, đang thay block điều hòa", room_type: { name: "Deluxe Ocean View" }, last_cleaned: "2 ngày trước" },
          { id: "r-401", room_number: "VIP_01", floor: 4, status: "AVAILABLE", notes: "Phòng tổng thống sẵn sàng đón đoàn ngoại giao", room_type: { name: "Royal VIP Suite" }, last_cleaned: "09:00 Sáng nay" },
        ]);
      }
    } catch (err) {
      console.error("Housekeeping fetch error:", err);
      // Fallback demo
      setRooms([
        { id: "r-101", room_number: "P101", floor: 1, status: "DIRTY", notes: "Khách trả phòng lúc 12:00, dọn thay ga", room_type: { name: "Deluxe Ocean View" } },
        { id: "r-201", room_number: "P201", floor: 2, status: "DIRTY", notes: "Khách VIP 14:00", room_type: { name: "Suite Premium" } },
        { id: "r-301", room_number: "P301", floor: 3, status: "MAINTENANCE", notes: "Hỏng vòi hoa sen", room_type: { name: "Presidential Suite" } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLaundryOrders = async () => {
    try {
      const res = await fetch("/api/laundry-bookings");
      if (res.ok) {
        const data = await res.json();
        setLaundryOrders(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch laundry orders:", err);
    } finally {
      setLaundryLoading(false);
    }
  };

  const handleUpdateLaundryStatus = async (id: string, status: string, statusText: string) => {
    try {
      const res = await fetch(`/api/laundry-bookings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, status_text: statusText }),
      });
      if (res.ok) {
        fetchLaundryOrders();
      } else {
        alert("Không thể cập nhật trạng thái đơn giặt là.");
      }
    } catch (err) {
      console.error("Failed to update laundry status:", err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchLaundryOrders();
    const interval = setInterval(fetchLaundryOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const changeStatus = async (roomId: string, newStatus: RoomTurnover["status"], additionalNotes?: string) => {
    const backupRooms = [...rooms];
    const updatedNotes = additionalNotes !== undefined ? additionalNotes : "";

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const finalNotes = additionalNotes !== undefined ? additionalNotes : r.notes;
          const updatedTime = newStatus === "AVAILABLE" ? "Vừa xong (" + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + ")" : r.last_cleaned;
          return { ...r, status: newStatus, notes: finalNotes, last_cleaned: updatedTime };
        }
        return r;
      })
    );

    if (!roomId.startsWith("r-")) {
      try {
        const res = await fetch(`/api/rooms/${roomId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, notes: updatedNotes }),
        });
        if (!res.ok) {
          const errData = await res.json();
          setRooms(backupRooms);
          alert(`Lỗi cập nhật: ${errData.error || "Yêu cầu bị hệ thống từ chối."}`);
        }
      } catch (err) {
        console.error("Failed status change:", err);
        setRooms(backupRooms);
        alert("Lỗi kết nối mạng, không thể lưu trạng thái mới.");
      }
    }
  };

  const dirtyRooms = rooms.filter((r) => r.status === "DIRTY" || r.status === "CLEANING");
  const maintenanceRooms = rooms.filter((r) => r.status === "MAINTENANCE");
  const inUseRooms = rooms.filter((r) => r.status === "IN_USE");
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE");

  const handleCompleteInspection = async (bookingId: string, roomId: string, hasDamage: boolean) => {
    if (hasDamage) {
      setTargetBookingId(bookingId);
      setReportingRoomId(roomId);
      return;
    }

    try {
      const res = await fetch("/api/housekeeping/checkout-requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, roomId, hasDamage, damageDescription: "", estimatedCharge: 0 }),
      });
      if (res.ok) {
        alert("Đã hoàn tất kiểm tra phòng.");
        fetchRooms();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error completing inspection");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen rounded-2xl">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              Housekeeping Operations Hub
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                ● 4 Luồng Nghiệp Vụ Chuyên Biệt
              </span>
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Phân chia riêng từng luồng: Dọn phòng trả, Sửa chữa bảo trì, Chăm sóc phòng đang ở và Kiểm duyệt phòng sẵn sàng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ButtonThird onClick={fetchRooms} sizeClass="px-4 py-2.5">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm Mới Dữ Liệu
          </ButtonThird>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div
          onClick={() => setActiveWorkflow("CHECKOUT_FLOW")}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            activeWorkflow === "CHECKOUT_FLOW"
              ? "bg-purple-600 text-white shadow-xl shadow-purple-600/30 scale-[1.02]"
              : "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40 hover:bg-purple-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${activeWorkflow === "CHECKOUT_FLOW" ? "text-white" : "text-purple-800 dark:text-purple-300"}`}>
              🟣 CHECKOUT INSPECT
            </p>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{checkoutRequests.length}</h3>
          <p className={`text-xs mt-1 ${activeWorkflow === "CHECKOUT_FLOW" ? "text-purple-100" : "text-neutral-500"}`}>Checkout requests</p>
        </div>

        <div
          onClick={() => setActiveWorkflow("DIRTY_FLOW")}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            activeWorkflow === "DIRTY_FLOW"
              ? "bg-amber-500 text-white shadow-xl shadow-amber-500/30 scale-[1.02]"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${activeWorkflow === "DIRTY_FLOW" ? "text-white" : "text-amber-800 dark:text-amber-300"}`}>
              🟡 Luồng 1: Chờ Dọn (DIRTY)
            </p>
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{dirtyRooms.length}</h3>
          <p className={`text-xs mt-1 ${activeWorkflow === "DIRTY_FLOW" ? "text-amber-100" : "text-neutral-500"}`}>Khách vừa trả phòng</p>
        </div>

        <div
          onClick={() => setActiveWorkflow("MAINTENANCE_FLOW")}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            activeWorkflow === "MAINTENANCE_FLOW"
              ? "bg-red-600 text-white shadow-xl shadow-red-600/30 scale-[1.02]"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40 hover:bg-red-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${activeWorkflow === "MAINTENANCE_FLOW" ? "text-white" : "text-red-800 dark:text-red-300"}`}>
              🔴 Luồng 2: Bảo Trì (MAINTENANCE)
            </p>
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{maintenanceRooms.length}</h3>
          <p className={`text-xs mt-1 ${activeWorkflow === "MAINTENANCE_FLOW" ? "text-red-100" : "text-neutral-500"}`}>Đang sửa chữa kỹ thuật</p>
        </div>

        <div
          onClick={() => setActiveWorkflow("IN_USE_FLOW")}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            activeWorkflow === "IN_USE_FLOW"
              ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]"
              : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 hover:bg-blue-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${activeWorkflow === "IN_USE_FLOW" ? "text-white" : "text-blue-800 dark:text-blue-300"}`}>
              🔵 Luồng 3: Đang Ở (IN_USE)
            </p>
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{inUseRooms.length}</h3>
          <p className={`text-xs mt-1 ${activeWorkflow === "IN_USE_FLOW" ? "text-blue-100" : "text-neutral-500"}`}>Dọn vệ sinh lưu trú hàng ngày</p>
        </div>

        <div
          onClick={() => setActiveWorkflow("AVAILABLE_FLOW")}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            activeWorkflow === "AVAILABLE_FLOW"
              ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-[1.02]"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${activeWorkflow === "AVAILABLE_FLOW" ? "text-white" : "text-emerald-800 dark:text-emerald-300"}`}>
              🟢 Luồng 4: Sẵn Sàng (AVAILABLE)
            </p>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{availableRooms.length}</h3>
          <p className={`text-xs mt-1 ${activeWorkflow === "AVAILABLE_FLOW" ? "text-emerald-100" : "text-neutral-500"}`}>Phòng sạch sẵn sàng đón khách</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-3 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <button
          onClick={() => setActiveWorkflow("DIRTY_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "DIRTY_FLOW"
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Luồng 1: Dọn Buồng Trả (Check-Out ➔ DIRTY ➔ AVAILABLE) ({dirtyRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("MAINTENANCE_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "MAINTENANCE_FLOW"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Wrench className="w-4 h-4" />
          Luồng 2: Sửa Chữa Bảo Trì (MAINTENANCE ➔ Nghiệm Thu) ({maintenanceRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("IN_USE_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "IN_USE_FLOW"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Luồng 3: Dọn Phòng Hàng Ngày (IN_USE) ({inUseRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("AVAILABLE_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "AVAILABLE_FLOW"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          Luồng 4: Rà Soát Sẵn Sàng (AVAILABLE) ({availableRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("LAUNDRY_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "LAUNDRY_FLOW"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Shirt className="w-4 h-4" />
          {isVN ? "Luồng 5: Dịch Vụ Giặt Là" : "Flow 5: Laundry Services"} (Laundry Orders) ({laundryOrders.filter(o => ["assigned", "washing", "ready_to_receive", "delivering"].includes(o.status_text)).length})
        </button>
      </div>

      {/* WORKFLOW 5: CHECKOUT INSPECTION FLOW */}
      {activeWorkflow === "CHECKOUT_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              🟣 CHECKOUT INSPECTION FLOW
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Guest requested checkout. Receptionist dispatched you to inspect for damages or lost items before payment.
            </p>
          </div>

          {checkoutRequests.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              No checkout inspection requests at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {checkoutRequests.map((req) => (
                <div key={req.id} className="bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-300 dark:border-purple-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-purple-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        Phòng {req.room?.room_number}
                      </span>
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                        {req.user?.full_name || req.guest?.full_name}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-200 dark:bg-purple-900/60 px-3 py-1 rounded-full uppercase">
                      Chờ Kiểm Tra
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleCompleteInspection(req.id, req.room_id, false)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Phòng Bình Thường
                    </button>
                    <button
                      onClick={() => handleCompleteInspection(req.id, req.room_id, true)}
                      className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-3 px-4 rounded-2xl transition-all text-sm flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Báo Hỏng / Mất Đồ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 1: DIRTY TURNOVER FLOW */}
      {activeWorkflow === "DIRTY_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              🟡 LUỒNG 1: QUY TRÌNH DỌN DẸP PHÒNG KHÁCH VỪA TRẢ (Check-Out Turnover)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Khi khách làm thủ tục Check-Out tại Lễ tân, phòng lập tức chuyển sang trạng thái <strong>Chưa Dọn (DIRTY)</strong>. Nhân viên buồng phòng dọn dẹp, thay ga, bổ sung tiện ích rồi bấm <strong>"✨ HOÀN TẤT DỌN DẸP"</strong> để bàn giao ngay cho Lễ tân đón khách mới.
            </p>
          </div>

          {dirtyRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              🎉 Tuyệt vời! Tất cả buồng phòng trả đều đã được dọn dẹp sạch sẽ và bàn giao cho Lễ tân.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dirtyRooms.map((room) => (
                <div key={room.id} className="bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-amber-500 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        Phòng {room.room_number}
                      </span>
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                        {room.room_type?.name || "Deluxe Ocean"} — Tầng {room.floor}
                      </h4>
                    </div>
                    {room.status === "DIRTY" ? (
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-3 py-1 rounded-full uppercase">
                        Chờ Dọn (DIRTY)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/60 px-3 py-1 rounded-full uppercase animate-pulse">
                        Đang Dọn Dẹp (CLEANING)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {room.notes && (
                      <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div><strong>Yêu cầu / Ghi chú:</strong> {room.notes}</div>
                      </div>
                    )}
                    <div className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Lần dọn gần nhất: {room.last_cleaned || "Hôm qua"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    {room.status === "DIRTY" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeStatus(room.id, "CLEANING", "Đang dọn nhanh (20p)")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Dọn nhanh 20p
                        </button>
                        <button
                          onClick={() => changeStatus(room.id, "CLEANING", "Đang dọn kỹ (45p)")}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 text-xs"
                        >
                          <SprayCan className="w-3.5 h-3.5" />
                          Dọn kỹ 45p
                        </button>
                      </div>
                    )}
                    
                    {room.status === "CLEANING" && (
                      <button
                        onClick={() => changeStatus(room.id, "AVAILABLE")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        ✨ HOÀN TẤT DỌN DẸP (➔ AVAILABLE)
                      </button>
                    )}
                    
                    {room.status === "DIRTY" && (
                      <button
                        onClick={() => setReportingRoomId(room.id)}
                        className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-2 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 mx-auto w-full mt-2"
                        title="Báo lỗi kỹ thuật / chuyển sang Luồng 2"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Báo Hỏng / Bảo trì
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 2: MAINTENANCE & INCIDENT FLOW */}
      {activeWorkflow === "MAINTENANCE_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              🔴 LUỒNG 2: QUY TRÌNH QUẢN LÝ MAINTENANCE & SỬA CHỮA SỰ CỐ (Maintenance & Repairs)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Các buồng phòng gặp sự cố kỹ thuật (điện, nước, khóa cửa, điều hòa) bị khóa tạm thời khỏi danh sách đặt phòng của Lễ tân. Khi kỹ thuật viên sửa chữa xong và vệ sinh sạch, nhấn <strong>"🛠️ Nghiệm Thu Sửa Chữa Xong"</strong> để khôi phục phòng về trạng thái <strong>AVAILABLE</strong>.
            </p>
          </div>

          {maintenanceRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              ✅ Tất cả thiết bị kỹ thuật trong các phòng đều hoạt động hoàn hảo! Không có phòng bảo trì.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {maintenanceRooms.map((room) => {
                const roomIncident = incidents.find((inc) => inc.room_id === room.id);
                return (
                  <div key={room.id} className="bg-red-50/60 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-red-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                          Phòng {room.room_number}
                        </span>
                        <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                          {room.room_type?.name || "Presidential Suite"} — Tầng {room.floor}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/60 px-3 py-1 rounded-full uppercase">
                        Đang Bảo Trì (LOCKED)
                      </span>
                    </div>

                    <div className="space-y-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-red-200 dark:border-red-800/40">
                      <div className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
                        <Wrench className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Sự cố kỹ thuật:</strong> {roomIncident?.description || room.notes || "Đang kiểm tra hệ thống điện nước"}
                        </div>
                      </div>
                      
                      {roomIncident?.detailed_note && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 pl-7">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Chi tiết:</span> {roomIncident.detailed_note}
                        </div>
                      )}

                      {roomIncident?.incident_evidence && roomIncident.incident_evidence.length > 0 && (
                        <div className="mt-3 pl-7">
                          <p className="text-[11px] font-semibold text-neutral-400 mb-1">Ảnh hiện trường:</p>
                          <img
                            src={roomIncident.incident_evidence[0].file_url}
                            alt="Evidence photo"
                            className="w-full max-h-40 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      {user?.role === "HOUSEKEEPING" ? (
                        <div className="text-[11px] text-neutral-500 italic text-center w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                          Chỉ Kỹ thuật viên / Giám sát mới được Nghiệm thu bảo trì
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            if (roomIncident) {
                              await fetch(`/api/incidents/${roomIncident.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'RESOLVED', note: 'Kỹ thuật viên nghiệm thu hoàn tất bảo trì phòng' })
                              });
                            }
                            await changeStatus(room.id, "AVAILABLE", "Đã sửa chữa xong & dọn vệ sinh sạch sẽ");
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCheck className="w-5 h-5" />
                          🛠️ NGHIỆM THU SỬA CHỮA XONG (➔ AVAILABLE)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 3: IN_USE STAYOVER CLEANING FLOW */}
      {activeWorkflow === "IN_USE_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              🔵 LUỒNG 3: QUY TRÌNH CHĂM SÓC PHÒNG ĐANG LƯU TRÚ (Stayover Make-Up Room)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Phòng đang có khách ở (<strong>IN_USE</strong>) cần được làm vệ sinh hàng ngày, đổ rác, gấp chăn màn và bổ sung nước khoáng/khăn tắm/amenities theo yêu cầu của khách hoặc tiêu chuẩn khách sạn.
            </p>
          </div>

          {inUseRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              Hiện tại không có phòng nào có khách lưu trú cần dọn dẹp hàng ngày.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inUseRooms.map((room) => (
                <div key={room.id} className="bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-blue-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        Phòng {room.room_number}
                      </span>
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                        {room.room_type?.name || "Family King"} — Tầng {room.floor}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/60 px-3 py-1 rounded-full uppercase">
                      Đang Có Khách (IN_USE)
                    </span>
                  </div>

                  {room.notes && (
                    <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 border border-blue-200 dark:border-blue-800/40 flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div><strong>Yêu cầu của khách:</strong> {room.notes}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        alert(`Đã ghi nhận hoàn tất dọn phòng lưu trú hàng ngày cho Phòng ${room.room_number}! Bổ sung 2 nước khoáng & thay khăn.`);
                        changeStatus(room.id, "IN_USE", "Đã làm vệ sinh lưu trú hôm nay");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Xác Nhận Đã Dọn Hàng Ngày (Make-Up Done)
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Nhập sự cố phát hiện trong phòng khách đang ở:", "Hỏng vòi nước nhà vệ sinh");
                        if (reason !== null) changeStatus(room.id, "MAINTENANCE", reason);
                      }}
                      className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-3 px-3 rounded-2xl transition-all text-xs"
                      title="Báo lỗi bảo trì"
                    >
                      Báo Hỏng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 4: AVAILABLE AUDIT FLOW */}
      {activeWorkflow === "AVAILABLE_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              🟢 LUỒNG 4: RÀ SOÁT & ĐẢM BẢO CHẤT LƯỢNG PHÒNG TRỐNG SẴN SÀNG (Available Audit)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Danh sách buồng phòng đã sạch sẽ và đang hiển thị trên hệ thống Lễ tân để đón khách mới. Giám sát buồng phòng (Supervisor) kiểm tra định kỳ lần cuối trước khi khách Check-In.
            </p>
          </div>

          {availableRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              Hiện không còn buồng phòng trống nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableRooms.map((room) => (
                <div key={room.id} className="bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-emerald-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        Phòng {room.room_number}
                      </span>
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-2">
                        {room.room_type?.name || "Deluxe Ocean"} — Tầng {room.floor}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full uppercase">
                      Sẵn Sàng
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    <div>⏱️ Lần kiểm tra cuối: {room.last_cleaned || "Sáng nay"}</div>
                    {room.notes && <div className="mt-1 text-emerald-800 dark:text-emerald-300 font-medium">✓ {room.notes}</div>}
                  </div>

                  {user?.role === "HOUSEKEEPING" ? (
                    <div className="text-[11px] text-neutral-550 italic text-center w-full py-2 bg-emerald-100/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/30">
                      Chỉ Giám sát/Lễ tân mới được đổi trạng thái phòng Sẵn sàng
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40 flex justify-between gap-2 w-full">
                      <button
                        onClick={() => changeStatus(room.id, "DIRTY", "Yêu cầu dọn lại trước khi đón khách đoàn")}
                        className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 py-2 px-3 rounded-xl transition-all"
                      >
                        Dọn Lại (➔ DIRTY)
                      </button>
                      <button
                        onClick={() => changeStatus(room.id, "MAINTENANCE", "Phát hiện lỗi kỹ thuật đột xuất")}
                        className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 py-2 px-3 rounded-xl transition-all"
                      >
                        Khóa Bảo Trì
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 5: LAUNDRY SERVICES OPERATION FLOW */}
      {activeWorkflow === "LAUNDRY_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-indigo-500" />
              {isVN ? "LUỒNG 5: QUY TRÌNH XỬ LÝ YÊU CẦU GIẶT LÀ" : "FLOW 5: LAUNDRY REQUESTS PROCESSING"} (Laundry Operations)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {isVN ? "Nhận đồ từ phòng khách, giặt hấp sấy ủi và bàn giao trả quần áo sạch cho khách. Mọi hoạt động được đồng bộ trực tiếp tới Lễ Tân và Khách Hàng." : "Receive items from guest rooms, wash/dry clean/press, and deliver clean clothes back to guests. All actions synced in real-time with Receptionist and Customer."}
            </p>
          </div>

          {laundryLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-neutral-450">{isVN ? "Đang tải danh sách đơn giặt là..." : "Loading laundry orders..."}</p>
            </div>
          ) : laundryOrders.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              {isVN ? "Chưa có đơn yêu cầu giặt là nào trong hệ thống." : "No laundry requests in the system."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {laundryOrders.map((order) => {
                const isAssigned = order.status_text === "assigned";
                const isWashing = order.status_text === "washing";
                const isWashed = order.status_text === "washed";
                const isReadyToReceive = order.status_text === "ready_to_receive";
                const isDelivering = order.status_text === "delivering";
                const isDelivered = order.status_text === "delivered";
                const isRejected = order.status_text === "rejected";

                let statusBadge = "";
                let cardBorder = "";

                if (isAssigned) {
                  statusBadge = isVN ? "⏳ Chờ Buồng phòng thu gom đồ" : "⏳ Housekeeping collecting clothes";
                  cardBorder = "border-purple-300 dark:border-purple-800/50 bg-purple-50/20 dark:bg-purple-950/10";
                } else if (isWashing) {
                  statusBadge = isVN ? "🌀 Đang giặt đồ (Washing)" : "🌀 Washing in progress";
                  cardBorder = "border-amber-300 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-950/10";
                } else if (isWashed) {
                  statusBadge = isVN ? "👕 Đã giặt xong — Chờ khách ở phòng báo" : "👕 Washed — Waiting for guest in room";
                  cardBorder = "border-indigo-300 dark:border-indigo-800/50 bg-indigo-50/20 dark:bg-indigo-950/10";
                } else if (isReadyToReceive) {
                  statusBadge = isVN ? "⏳ Chờ Lễ tân duyệt trả đồ" : "⏳ Waiting for receptionist delivery approval";
                  cardBorder = "border-orange-300 dark:border-orange-800/50 bg-orange-50/20 dark:bg-orange-950/10 animate-pulse";
                } else if (isDelivering) {
                  statusBadge = isVN ? "🚚 Đang trả đồ (Delivering)" : "🚚 Delivering";
                  cardBorder = "border-blue-300 dark:border-blue-800/50 bg-blue-50/20 dark:bg-blue-950/10 animate-bounce";
                } else if (isDelivered) {
                  statusBadge = isVN ? "✅ Đã giao đồ thành công" : "✅ Delivered successfully";
                  cardBorder = "border-emerald-300 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/10";
                } else {
                  statusBadge = isVN ? "❌ Bị từ chối" : "❌ Rejected";
                  cardBorder = "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/20";
                }

                return (
                  <div key={order.id} className={`border-2 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm transition-all ${cardBorder}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-neutral-800 text-white dark:bg-neutral-900 font-extrabold px-3 py-1 rounded-2xl text-xs shadow">
                          Phòng {order.room_number || "P-VIP"}
                        </span>
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-3">
                          Mã đơn: #{order.id.slice(0, 8).toUpperCase()}
                        </h4>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300">
                        {statusBadge}
                      </span>
                    </div>

                    <div className="text-xs space-y-2">
                      <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {isVN ? "Loại dịch vụ:" : "Service Type:"} <span className="text-indigo-600 dark:text-indigo-400 font-black">{order.service_type === "Wash & Fold" ? (isVN ? "Giặt thường (Wash & Fold)" : "Wash & Fold") : order.service_type === "Dry Cleaning" ? (isVN ? "Giặt khô / Giặt hấp" : "Dry Cleaning") : (isVN ? "Chỉ ủi / là (Pressing Only)" : "Pressing Only")}</span>
                      </div>
                      
                      {/* Items */}
                      <div className="bg-white/80 dark:bg-neutral-900/60 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-1">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase block tracking-wider mb-1">{isVN ? "Đồ cần giặt:" : "Items to wash:"}</span>
                        {order.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{it.quantity}x {translateService(it.service?.name || "Service", it.service?.description, isVN).name}</span>
                            <span className="text-neutral-500 font-mono text-[10px]">({new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(it.unit_price)}/{isVN ? "cái" : "item"})</span>
                          </div>
                        ))}
                      </div>

                      {order.customer_notes && (
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-[11px] italic text-neutral-750 dark:text-neutral-300 border border-amber-500/20">
                          <strong>{isVN ? "Ghi chú của khách:" : "Guest notes:"}</strong> {order.customer_notes}
                        </div>
                      )}
                      
                      <div className="flex justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-850">
                        <span>{isVN ? "Đặt lúc:" : "Ordered at:"} {new Date(order.created_at).toLocaleTimeString(isVN ? "vi-VN" : "en-US")} - {new Date(order.created_at).toLocaleDateString(isVN ? "vi-VN" : "en-US")}</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{isVN ? "Tổng cộng:" : "Total:"} {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(order.total_amount || 0)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      {isAssigned && (
                        <button
                          onClick={() => handleUpdateLaundryStatus(order.id, "PENDING", "washing")}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          🌀 {isVN ? "NHẬN ĐỒ VÀ ĐANG GIẶT" : "RECEIVE AND START WASHING"}
                        </button>
                      )}

                      {isWashing && (
                        <button
                          onClick={() => handleUpdateLaundryStatus(order.id, "PENDING", "washed")}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs"
                        >
                          👕 {isVN ? "ĐÃ GIẶT XONG & SẴN SÀNG GIAO" : "WASHED & READY FOR DELIVERY"}
                        </button>
                      )}

                      {isReadyToReceive && (
                        <div className="text-[10px] text-neutral-500 italic text-center w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                          ⏳ {isVN ? "Chờ Lễ tân duyệt giao đồ..." : "Waiting for receptionist delivery approval..."}
                        </div>
                      )}

                      {isDelivering && (
                        <button
                          onClick={() => handleUpdateLaundryStatus(order.id, "COMPLETED", "delivered")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs animate-bounce"
                        >
                          <Truck className="w-4 h-4" /> {isVN ? "BÀN GIAO ĐỒ XONG (Trả Đồ)" : "DELIVERED SUCCESSFULLY"}
                        </button>
                      )}

                      {isWashed && (
                        <div className="text-[10px] text-neutral-500 italic text-center w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                          ⏳ {isVN ? "Đã giặt sạch. Đang đợi Khách hàng báo sẵn sàng ở phòng để mang lên trả..." : "Washed. Waiting for guest confirmation to deliver..."}
                        </div>
                      )}

                      {isDelivered && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center w-full py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          ✓ {isVN ? "Đã trả xong đồ & cộng nợ phòng thành công" : "Delivered & debt charged successfully"}
                        </div>
                      )}

                      {isRejected && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold text-center w-full py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                          {isVN ? "Đơn hàng bị từ chối" : "Order rejected"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL BÁO HỎNG / BẢO TRÌ */}
      {reportingRoomId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-neutral-100 dark:border-neutral-800 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-red-600" />
                Báo hỏng phòng {rooms.find(r => r.id === reportingRoomId)?.room_number}
              </h3>
              <button
                onClick={() => {
                  setReportingRoomId(null);
                  setSelectedDamages([]);
                  setCustomDamageName("");
                  setCustomDamagePrice("");
                  setDamageNote("");
                  setDamageImage(null);
                  setTargetBookingId(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors text-2xl font-semibold"
              >
                &times;
              </button>
            </div>

            {/* PREDEFINED DAMAGES LIST */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Chọn danh mục hỏng hóc:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {[
                  { name: "Hỏng Tivi", price: 150 },
                  { name: "Hỏng Điều hòa", price: 200 },
                  { name: "Hỏng Tủ lạnh", price: 100 },
                  { name: "Bình nước hỏng", price: 10 },
                  { name: "Bình nóng lạnh hỏng", price: 80 },
                  { name: "Rách/Bẩn Ga giường", price: 30 },
                  { name: "Mất/Hỏng khăn tắm", price: 15 },
                ].map((item) => {
                  const isChecked = selectedDamages.some(d => d.name === item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleToggleDamage(item)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between h-16 ${
                        isChecked
                          ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400 font-bold"
                          : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className="opacity-80">${item.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM DAMAGE SECTION */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Hỏng hóc tùy chỉnh khác:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên đồ dùng hư hỏng..."
                  value={customDamageName}
                  onChange={(e) => setCustomDamageName(e.target.value)}
                  className="flex-1 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Giá (USD)"
                  value={customDamagePrice}
                  onChange={(e) => setCustomDamagePrice(e.target.value)}
                  className="w-24 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* UPLOAD IMAGE SECTION */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Tải lên hình ảnh hiện trường / bằng chứng:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDamageImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
              {damageImage && (
                <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 mt-2">
                  <img src={damageImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setDamageImage(null)}
                    className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* DETAILED NOTE */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Ghi chú chi tiết hư hại:
              </label>
              <textarea
                placeholder="Ghi chú thêm về lỗi kỹ thuật, vị trí hư hại..."
                value={damageNote}
                onChange={(e) => setDamageNote(e.target.value)}
                rows={2}
                className="w-full text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setReportingRoomId(null);
                  setSelectedDamages([]);
                  setCustomDamageName("");
                  setCustomDamagePrice("");
                  setDamageNote("");
                  setDamageImage(null);
                  setTargetBookingId(null);
                }}
                className="flex-1 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmittingDamage}
                onClick={async () => {
                  let allDamages = [...selectedDamages];
                  if (customDamageName && customDamagePrice) {
                    allDamages.push({ name: customDamageName, price: Number(customDamagePrice) || 0 });
                  }
                  
                  if (allDamages.length === 0) {
                    alert("Vui lòng chọn hoặc nhập nhất một mục hỏng hóc.");
                    return;
                  }

                  setIsSubmittingDamage(true);
                  try {
                    const totalCharge = allDamages.reduce((sum, item) => sum + item.price, 0);
                    const description = allDamages.map(d => `${d.name} ($${d.price})`).join(', ');

                    // 1. Create incident
                    const res = await fetch('/api/incidents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        room_id: reportingRoomId,
                        booking_id: targetBookingId || undefined,
                        incident_type: 'DAMAGE',
                        severity: 'MEDIUM',
                        description: description,
                        detailed_note: damageNote || 'Báo cáo từ nhân viên buồng phòng',
                        estimated_charge: totalCharge,
                        is_chargeable: true,
                        evidence_image: damageImage
                      })
                    });

                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      let errMsg = errData.error || errData.message || "Failed to report incident";
                      if (errData.details) {
                        errMsg += " - Chi tiết: " + JSON.stringify(errData.details);
                      }
                      throw new Error(errMsg);
                    }

                    // 2. Change room status to MAINTENANCE
                    await changeStatus(reportingRoomId!, "MAINTENANCE", `Báo hỏng: ${description}. ${damageNote}`);

                    // 3. If targetBookingId is present, mark the checkout inspection completed with damage
                    if (targetBookingId) {
                      await fetch("/api/housekeeping/checkout-requests/complete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bookingId: targetBookingId,
                          roomId: reportingRoomId,
                          hasDamage: true,
                          damageDescription: description,
                          estimatedCharge: totalCharge
                        }),
                      });
                    }

                    // Reset form
                    setReportingRoomId(null);
                    setSelectedDamages([]);
                    setCustomDamageName("");
                    setCustomDamagePrice("");
                    setDamageNote("");
                    setDamageImage(null);
                    setTargetBookingId(null);
                    fetchRooms();
                    alert("Báo cáo hỏng hóc & Đưa phòng vào diện bảo trì thành công!");
                  } catch (err: any) {
                    alert("Lỗi khi báo hỏng: " + err.message);
                  } finally {
                    setIsSubmittingDamage(false);
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl disabled:opacity-50 text-sm shadow flex items-center justify-center gap-2"
              >
                {isSubmittingDamage ? "Đang xử lý..." : "Xác nhận báo hỏng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
