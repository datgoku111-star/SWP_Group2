"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "../dashboard/layout";
import { useRouter } from "next/navigation";
import type { ServiceOrder, OrderStatus } from "@/types/hotel";
import useRealtimeOrders from "@/hooks/useRealtimeOrders";
import { Clock, CheckCircle2, ChefHat, Bell, BellOff, Utensils, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OrdersQueuePage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "FOOD_BEVERAGE">("ALL");
  const [soundAlert, setSoundAlert] = useState(true);
  const prevPendingCount = useRef<number>(-1);

  // Auto switch to FOOD_BEVERAGE segmentation if logged-in user role is KITCHEN (Chef)
  useEffect(() => {
    if (user?.role === "KITCHEN") {
      setCategoryFilter("FOOD_BEVERAGE");
    }
  }, [user]);

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
    try {
      const url = `/api/orders?status=PENDING,IN_PROGRESS,COMPLETED${
        categoryFilter === "FOOD_BEVERAGE" ? "&category=FOOD,BEVERAGE" : ""
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);

        const currentPending = Array.isArray(data)
          ? data.filter((o: any) => o.status === "PENDING").length
          : 0;
        if (
          soundAlert &&
          prevPendingCount.current !== -1 &&
          currentPending > prevPendingCount.current
        ) {
          playBellSound();
        }
        prevPendingCount.current = currentPending;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, soundAlert, playBellSound]);

  // Hook into Supabase realtime updates
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
    if (!isLoading) {
      if (!user || !["ADMIN", "KITCHEN", "RECEPTIONIST"].includes(user.role)) {
        router.push("/dashboard");
      } else {
        fetchOrders();
      }
    }
  }, [user, isLoading, router, fetchOrders]);

  const updateStatus = async (id: string, status: OrderStatus, customNotes?: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: customNotes }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || loading)
    return <div className="container py-20">{t("ordersLoading")}</div>;

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const inProgressOrders = orders.filter((o) => o.status === "IN_PROGRESS");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const OrderCard = ({ order }: { order: ServiceOrder }) => {
    const isForwarded = order.notes && order.notes.includes("[FORWARDED_TO_KITCHEN]");
    const isReceptionistOrAdmin = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <span className="font-extrabold text-base text-neutral-900 dark:text-white">
              Phòng {order.booking?.room?.room_number || "401"}
            </span>
            <div className="text-xs text-neutral-400 mt-0.5 font-mono">
              #{order.id.slice(-6)}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.status === "PENDING"
                ? isForwarded
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                : order.status === "IN_PROGRESS"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                : order.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {order.status === "PENDING"
              ? isForwarded
                ? "👨‍🍳 Đã chuyển Bếp"
                : "⏳ Chờ Lễ Tân duyệt"
              : order.status === "IN_PROGRESS"
              ? "🔥 Đang chế biến"
              : order.status === "COMPLETED"
              ? "✅ COMPLETED"
              : "CANCELLED"}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {item.quantity}x {item.service?.name}
              </span>
              <span className="text-xs font-bold text-neutral-400 uppercase">{item.service?.category}</span>
            </div>
          ))}
          {order.notes && (
            <div className="mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 italic border border-neutral-100 dark:border-neutral-700">
              📝 Ghi chú: {order.notes.replace(/\[FORWARDED_TO_KITCHEN\]/g, "").replace(/\[EST_TIME:[^\]]+\]/g, "").trim() || "Không có ghi chú"}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 gap-2">
          {order.status === "PENDING" && !isForwarded && isReceptionistOrAdmin ? (
            <button
              onClick={() => {
                const updatedNotes = ((order.notes || "") + " [FORWARDED_TO_KITCHEN]").trim();
                updateStatus(order.id, "PENDING", updatedNotes);
              }}
              className="flex-1 bg-primary-6000 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> ✅ Duyệt & Chuyển Bếp
            </button>
          ) : order.status === "PENDING" ? (
            <button
              onClick={() => updateStatus(order.id, "IN_PROGRESS")}
              className="flex-1 bg-orange-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <ChefHat className="w-4 h-4" /> 👨‍🍳 Bắt đầu chế biến
            </button>
          ) : order.status === "IN_PROGRESS" ? (
            <button
              onClick={() => updateStatus(order.id, "COMPLETED")}
              className="flex-1 bg-emerald-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> 🚀 Hoàn thành & Giao phòng
            </button>
          ) : (
            <div className="flex-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 py-1.5">
              <CheckCircle2 className="w-4 h-4" /> Đã giao hàng thành công
            </div>
          )}

          {order.status !== "COMPLETED" && (
            <button
              onClick={() => updateStatus(order.id, "CANCELLED")}
              className="px-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 py-2.5 rounded-xl text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Hủy
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container py-10 mb-24 lg:mb-32 space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white">
            Live Order Queue & Receptionist Service Console
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Lễ tân duyệt đơn phòng khách ➔ Chuyển Bếp chế biến ➔ Bếp hoàn tất giao phòng & ghi nợ tự động.
          </p>
        </div>

        {/* Chef & F&B Segmentation Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-100 dark:bg-neutral-800/80 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> Lọc nghiệp vụ (Segmentation):
            </span>
            <div className="flex bg-white dark:bg-neutral-900 rounded-xl p-1 shadow-sm border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === "ALL"
                    ? "bg-primary-6000 text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                Tất cả dịch vụ
              </button>
              <button
                onClick={() => setCategoryFilter("FOOD_BEVERAGE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryFilter === "FOOD_BEVERAGE"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" /> Ẩm thực Bếp (Chef Only)
              </button>
            </div>
          </div>

          <button
            onClick={() => setSoundAlert(!soundAlert)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              soundAlert
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700"
            }`}
          >
            {soundAlert ? (
              <>
                <Bell className="w-4 h-4 animate-bounce text-emerald-600 dark:text-emerald-400" />
                <span>Chuông báo: BẬT (Sound ON)</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Chuông báo: TẮT (Muted)</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Columns Layout: Incoming Orders | In Preparation | Completed & Delivered */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Pending Orders */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px] border border-neutral-200 dark:border-neutral-700 space-y-4">
            <h3 className="text-lg font-bold flex items-center justify-between text-neutral-900 dark:text-white">
              <span>⏳ {t("ordersIncomingOrders")}</span>
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                {pendingOrders.length}
              </span>
            </h3>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {pendingOrders.length === 0 && (
                <div className="text-center text-neutral-400 py-12 text-sm border border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl">
                  {t("ordersNoPendingOrders")}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress Orders */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px] border border-neutral-200 dark:border-neutral-700 space-y-4">
            <h3 className="text-lg font-bold flex items-center justify-between text-neutral-900 dark:text-white">
              <span>🔥 {t("ordersInPreparation")}</span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                {inProgressOrders.length}
              </span>
            </h3>
            <div className="space-y-4">
              {inProgressOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {inProgressOrders.length === 0 && (
                <div className="text-center text-neutral-400 py-12 text-sm border border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl">
                  {t("ordersNoOrdersInProgress")}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Completed Orders */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px] border border-neutral-200 dark:border-neutral-700 space-y-4">
            <h3 className="text-lg font-bold flex items-center justify-between text-neutral-900 dark:text-white">
              <span>✅ Đã Giao Phòng (Completed)</span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                {completedOrders.length}
              </span>
            </h3>
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {completedOrders.length === 0 && (
                <div className="text-center text-neutral-400 py-12 text-sm border border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl">
                  Chưa có đơn nào đã hoàn thành.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
