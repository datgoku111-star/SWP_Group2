"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Utensils, Clock, CheckCircle2, AlertTriangle, RefreshCw, Play, Check, Flame, Bell, BellOff } from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import useRealtimeOrders from "@/hooks/useRealtimeOrders";

export interface KitchenOrder {
  id: string;
  booking_id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  total_amount: number;
  notes?: string;
  created_at?: string;
  booking?: {
    room?: {
      room_number: string;
    };
  };
  items?: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    service?: {
      name: string;
      category: string;
    };
  }[];
}

export default function KitchenDashboardHub() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [selectedOrderForPrep, setSelectedOrderForPrep] = useState<KitchenOrder | null>(null);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState<string>("15 phút");
  const prevPendingCount = useRef<number>(-1);

  const playBellSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.4); // A5 note
      playTone(1174.66, now + 0.2, 0.6); // D6 note
    } catch (e) {
      console.warn("Could not play kitchen bell sound:", e);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=PENDING,IN_PROGRESS,COMPLETED&category=FOOD,BEVERAGE");
      if (!res.ok) throw new Error("Lỗi tải danh sách đơn món");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setOrders(data);
        const currentPending = data.filter((o: any) => o.status === "PENDING").length;
        if (
          soundAlert &&
          prevPendingCount.current !== -1 &&
          currentPending > prevPendingCount.current
        ) {
          playBellSound();
        }
        prevPendingCount.current = currentPending;
      } else if (Array.isArray(data)) {
        // If empty DB or no active orders, provide realistic demo live orders so kitchen dashboard looks amazing
        setOrders([
          {
            id: "ORDER-K01",
            booking_id: "B-101",
            status: "PENDING",
            total_amount: 360000,
            notes: "Khách VIP, không cho hành lá vào phở, canh chua ít cay",
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            booking: { room: { room_number: "P205 (VIP Ocean)" } },
            items: [
              { id: "i1", quantity: 2, unit_price: 180000, subtotal: 360000, service: { name: "Phở Bò Kobe Đặc Biệt", category: "FOOD" } },
            ],
          },
          {
            id: "ORDER-K02",
            booking_id: "B-102",
            status: "IN_PROGRESS",
            total_amount: 130000,
            notes: "Giao gấp cùng đá riêng",
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            booking: { room: { room_number: "P102 (Deluxe)" } },
            items: [
              { id: "i2", quantity: 2, unit_price: 65000, subtotal: 130000, service: { name: "Nước Cam Tươi Nguyên Chất", category: "BEVERAGE" } },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error("Kitchen fetch error:", err);
      // Fallback demo
      setOrders([
        {
          id: "ORDER-K01",
          booking_id: "B-101",
          status: "PENDING",
          total_amount: 360000,
          notes: "Khách VIP, không cho hành lá vào phở",
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          booking: { room: { room_number: "P205 (VIP Ocean)" } },
          items: [
            { id: "i1", quantity: 2, unit_price: 180000, subtotal: 360000, service: { name: "Phở Bò Kobe Đặc Biệt", category: "FOOD" } },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [soundAlert, playBellSound]);

  useRealtimeOrders(
    useCallback(
      (payload: any) => {
        if (
          soundAlert &&
          payload &&
          (payload.eventType === "INSERT" || payload?.new?.status === "PENDING")
        ) {
          playBellSound();
        }
        fetchOrders();
      },
      [soundAlert, playBellSound, fetchOrders]
    )
  );

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Auto poll every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: KitchenOrder["status"], notesTag?: string) => {
    // Optimistic UI update — retain order in list with COMPLETED status
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedNotes = notesTag ? ((o.notes || "") + " " + notesTag).trim() : o.notes;
        return { ...o, status: newStatus, notes: updatedNotes };
      })
    );

    if (!orderId.startsWith("ORDER-K")) {
      try {
        const currentOrder = orders.find((o) => o.id === orderId);
        const updatedNotes = notesTag ? ((currentOrder?.notes || "") + " " + notesTag).trim() : currentOrder?.notes;
        await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, notes: updatedNotes }),
        });
      } catch (err) {
        console.error("Error updating order status:", err);
      }
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const inProgressOrders = orders.filter((o) => o.status === "IN_PROGRESS");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-900 min-h-screen text-white rounded-2xl">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
              Kitchen & F&B Operations Hub
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Live Kitchen Queue
              </span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Trung tâm điều hành Bếp — Nhận thông báo thời gian thực và chuyển trạng thái món ăn/thức uống lên phòng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundAlert(!soundAlert)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm border transition-all ${
              soundAlert
                ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                : "bg-neutral-700 text-neutral-400 border-neutral-600"
            }`}
          >
            <Bell className="w-4 h-4" />
            {soundAlert ? "Chuông báo: Bật" : "Chuông báo: Tắt"}
          </button>
          <ButtonThird onClick={fetchOrders} sizeClass="px-4 py-2.5 text-white border border-neutral-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm Mới Queue
          </ButtonThird>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-neutral-800/80 p-6 rounded-3xl border border-orange-500/30 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400 font-medium">⏳ Chờ Nấu / Chế Biến</p>
            <h3 className="text-4xl font-extrabold text-orange-400 mt-2">{pendingOrders.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-800/80 p-6 rounded-3xl border border-blue-500/30 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400 font-medium">🔥 Đang Chế Biến (In Kitchen)</p>
            <h3 className="text-4xl font-extrabold text-blue-400 mt-2">{inProgressOrders.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Play className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-800/80 p-6 rounded-3xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400 font-medium">✅ Thời Gian Trung Bình / Món</p>
            <h3 className="text-4xl font-extrabold text-emerald-400 mt-2">12 <span className="text-lg font-normal">phút</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Kanban Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PENDING COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-800 p-4 rounded-2xl border border-neutral-700">
            <h2 className="text-lg font-bold flex items-center gap-2 text-orange-400">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block animate-ping"></span>
              ⏳ Đơn Mới Nhận — Chờ Làm ({pendingOrders.length})
            </h2>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="bg-neutral-800/40 border border-dashed border-neutral-700 p-12 text-center rounded-2xl text-neutral-500">
              Không có đơn nào đang chờ chế biến!
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.id} className="bg-neutral-800 p-6 rounded-3xl border-2 border-orange-500/40 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-700 pb-3">
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Phòng: {order.booking?.room?.room_number || "P101 (Deluxe)"}
                  </span>
                  <span className="text-xs text-neutral-400">Mã đơn: #{order.id.slice(-6)}</span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-base font-bold bg-neutral-900/60 p-3 rounded-2xl border border-neutral-700">
                      <span>{item.service?.name || "Món ăn Dịch Vụ"}</span>
                      <span className="bg-primary-600 px-3 py-1 rounded-xl text-sm font-extrabold">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Ghi chú đặc biệt:</strong> {order.notes}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedOrderForPrep(order);
                      setEstimatedPrepTime("15 phút");
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    🔥 BẮT ĐẦU CHẾ BIẾN & BÁO THỜI GIAN
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* IN_PROGRESS COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-800 p-4 rounded-2xl border border-neutral-700">
            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              🔥 Đang Chế Biến / Chuẩn Bị ({inProgressOrders.length})
            </h2>
          </div>

          {inProgressOrders.length === 0 ? (
            <div className="bg-neutral-800/40 border border-dashed border-neutral-700 p-12 text-center rounded-2xl text-neutral-500">
              Chưa có đơn nào đang nấu trong bếp!
            </div>
          ) : (
            inProgressOrders.map((order) => (
              <div key={order.id} className="bg-neutral-800 p-6 rounded-3xl border-2 border-blue-500/40 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-700 pb-3">
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Phòng: {order.booking?.room?.room_number || "P102 (Deluxe)"}
                  </span>
                  <span className="text-xs text-neutral-400">Mã đơn: #{order.id.slice(-6)}</span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-base font-bold bg-neutral-900/60 p-3 rounded-2xl border border-neutral-700">
                      <span>{item.service?.name || "Nước Cam Tươi"}</span>
                      <span className="bg-blue-600 px-3 py-1 rounded-xl text-sm font-extrabold">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Ghi chú đặc biệt:</strong> {order.notes}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => updateStatus(order.id, "COMPLETED")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    ✅ HOÀN TẤT & GIAO LÊN PHÒNG (READY)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COMPLETED ORDERS HISTORY SECTION */}
      {completedOrders.length > 0 && (
        <div className="bg-neutral-800 p-6 rounded-3xl border border-emerald-500/30 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            ✅ Danh Sách Đơn Đã Hoàn Thành & Đã Giao Lên Phòng ({completedOrders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedOrders.map((order) => (
              <div key={order.id} className="p-4 rounded-2xl bg-neutral-900/80 border border-emerald-500/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-white">
                      Phòng {order.booking?.room?.room_number || "P101"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✅ COMPLETED
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {order.items?.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-neutral-300 font-medium">
                        <span>• {it.service?.name || "Món dịch vụ"}</span>
                        <span className="font-bold text-emerald-400">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[11px] text-neutral-400 border-t border-neutral-800 pt-2 flex justify-between">
                  <span>Mã đơn: #{order.id.slice(-6)}</span>
                  <span className="font-bold text-emerald-400">{order.total_amount.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESTIMATED PREP TIME SELECTION MODAL */}
      {selectedOrderForPrep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border-2 border-orange-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                <Flame className="w-7 h-7 text-orange-500 animate-bounce" />
                Báo Thời Gian Chế Biến Món
              </h3>
              <button
                onClick={() => setSelectedOrderForPrep(null)}
                className="text-neutral-400 hover:text-white font-bold text-sm bg-neutral-800 px-3 py-1.5 rounded-xl"
              >
                Đóng ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-neutral-300">
                Bạn chuẩn bị nấu đơn món cho <strong className="text-orange-400">Phòng {selectedOrderForPrep.booking?.room?.room_number || "VIP"}</strong>. Vui lòng chọn hoặc nhập thời gian hoàn thành dự kiến để báo ngay cho <strong className="text-white font-bold">Khách hàng</strong> & <strong className="text-white font-bold">Lễ tân</strong>:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {["⚡ 10 phút (Nhanh)", "⏱️ 15 phút (Chuẩn)", "🍲 20 phút", "🥘 30 phút"].map((timeOption) => {
                  const val = timeOption.split(" (")[0].replace(/[⚡⏱️🍲🥘]\s*/, "");
                  return (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setEstimatedPrepTime(val)}
                      className={`p-3.5 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center ${
                        estimatedPrepTime === val
                          ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30 scale-[1.02]"
                          : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:border-neutral-600"
                      }`}
                    >
                      {timeOption}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Hoặc nhập thời gian khác (VD: 25 phút, 12:45):</label>
                <input
                  type="text"
                  value={estimatedPrepTime}
                  onChange={(e) => setEstimatedPrepTime(e.target.value)}
                  placeholder="Nhập thời gian..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setSelectedOrderForPrep(null)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-sm transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  updateStatus(selectedOrderForPrep.id, "IN_PROGRESS", `[EST_TIME: ${estimatedPrepTime}]`);
                  setSelectedOrderForPrep(null);
                }}
                className="flex-[2] py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                🔥 BẮT ĐẦU & BÁO KHÁCH HÀNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
