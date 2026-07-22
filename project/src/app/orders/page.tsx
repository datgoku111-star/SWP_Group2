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

  const updateStatus = async (id: string, status: OrderStatus, extraNote?: string) => {
    try {
      const order = orders.find((o) => o.id === id);
      let newNotes = order?.notes || "";
      if (extraNote) {
        if (
          extraNote.includes("[DELIVERED_WAITING_CONFIRM]") ||
          extraNote.includes("[CUSTOMER_NOT_RECEIVED]") ||
          extraNote.includes("[REDO_REQUESTED_BY_RECEPTIONIST]") ||
          extraNote.includes("[CUSTOMER_CONFIRMED]")
        ) {
          newNotes = newNotes
            .replace(/\[DELIVERED_WAITING_CONFIRM\]/g, "")
            .replace(/\[CUSTOMER_NOT_RECEIVED\]/g, "")
            .replace(/\[REDO_REQUESTED_BY_RECEPTIONIST\]/g, "")
            .replace(/\[CUSTOMER_CONFIRMED\]/g, "")
            .trim();
        }
        newNotes = newNotes ? `${newNotes}\n${extraNote}` : extraNote;
      }

      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: newNotes }),
      });
      // Realtime subscription will handle the UI refresh, but optimistic update is nice too
      setOrders(
        orders.map((o) => {
          if (o.id === id) {
             return { ...o, status, notes: newNotes };
          }
          return o;
        })
      );
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
    const isDelivered = order.notes && order.notes.includes("[DELIVERED_WAITING_CONFIRM]");
    const isNotReceived = order.notes && order.notes.includes("[CUSTOMER_NOT_RECEIVED]");
    const isRedoRequested = order.notes && order.notes.includes("[REDO_REQUESTED_BY_RECEPTIONIST]");
    const isConfirmed = order.notes && order.notes.includes("[CUSTOMER_CONFIRMED]");

    return (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xl font-bold">
            Room {order.booking?.room?.room_number}
          </div>
          <div className="text-sm text-neutral-500 flex items-center mt-1">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            order.status === "PENDING"
              ? "bg-amber-100 text-amber-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="border-t border-b border-neutral-100 dark:border-neutral-800 py-3 space-y-2">
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="font-medium">
              {item.quantity}x {item.service?.name}
            </span>
            <span className="text-neutral-500">{item.service?.category}</span>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-sm italic">
            {t("ordersNoteLabel")} {order.notes}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-1 flex-wrap gap-2">
        {order.status === "PENDING" && !isForwarded && (user?.role === "RECEPTIONIST" || user?.role === "ADMIN") && (
          <button
            onClick={() => updateStatus(order.id, "PENDING", "[FORWARDED_TO_KITCHEN]")}
            className="flex-1 min-w-[150px] bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận & Chuyển Bếp
          </button>
        )}

        {order.status === "IN_PROGRESS" && isNotReceived && (user?.role === "RECEPTIONIST" || user?.role === "ADMIN") && (
          <button
            onClick={() => updateStatus(order.id, "IN_PROGRESS", "[REDO_REQUESTED_BY_RECEPTIONIST]")}
            className="flex-1 min-w-[150px] bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Báo Bếp làm lại
          </button>
        )}

        {order.status === "PENDING" && isForwarded && (user?.role === "KITCHEN" || user?.role === "ADMIN") && (
          <button
            onClick={() => {
              const time = window.prompt("Nhập thời gian dự kiến (vd: 15 phút):", "15 phút");
              if (time) {
                updateStatus(order.id, "IN_PROGRESS", `[EST_TIME: ${time}]`);
              }
            }}
            className="flex-1 min-w-[150px] bg-primary-6000 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
          >
            <ChefHat className="w-4 h-4 mr-2" /> Bếp Nhận & Báo Giờ
          </button>
        )}

        {order.status === "PENDING" && !isForwarded && user?.role === "KITCHEN" && (
           <span className="flex-1 min-w-[150px] text-sm text-neutral-500 flex items-center justify-center">Đợi Lễ tân duyệt...</span>
        )}

        {order.status === "IN_PROGRESS" && (!isDelivered && !isNotReceived && !isConfirmed) && (user?.role === "KITCHEN" || user?.role === "ADMIN") && (
          <button
            onClick={() => updateStatus(order.id, "IN_PROGRESS", "[DELIVERED_WAITING_CONFIRM]")}
            className="flex-1 min-w-[150px] bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Hoàn thành & Giao món
          </button>
        )}

        {order.status === "IN_PROGRESS" && isDelivered && (user?.role === "KITCHEN" || user?.role === "ADMIN") && (
          <span className="flex-1 min-w-[150px] text-sm text-neutral-500 flex items-center justify-center">Đã giao - Đợi Khách xác nhận...</span>
        )}

        {order.status === "COMPLETED" && isConfirmed && (
          <span className="flex-1 min-w-[150px] text-sm text-emerald-600 font-medium flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Khách đã xác nhận
          </span>
        )}
        <button
          onClick={() => updateStatus(order.id, "CANCELLED")}
          className="px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          {t("ordersCancel")}
        </button>
      </div>
    </div>
  );
  };

  return (
    <DashboardLayout>
      <div className="container py-16 mb-24 lg:mb-32">
        <h2 className="text-3xl font-semibold sm:text-4xl mb-6">Live Order Queue</h2>

        {/* Chef & F&B Segmentation Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-neutral-100 dark:bg-neutral-800/80 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
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

      <div className={`grid grid-cols-1 lg:grid-cols-2 ${(user?.role === "RECEPTIONIST" || user?.role === "ADMIN") ? "xl:grid-cols-3" : ""} gap-8`}>
        {/* Pending Column */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px]">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
            <span>{t("ordersIncomingOrders")}</span>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
              {pendingOrders.length}
            </span>
          </h3>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center text-neutral-500 py-10">
                {t("ordersNoPendingOrders")}
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px]">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
            <span>{t("ordersInPreparation")}</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {inProgressOrders.length}
            </span>
          </h3>
          <div className="space-y-4">
            {inProgressOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {inProgressOrders.length === 0 && (
              <div className="text-center text-neutral-500 py-10">
                {t("ordersNoOrdersInProgress")}
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        {(user?.role === "RECEPTIONIST" || user?.role === "ADMIN") && (
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px]">
            <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
              <span>Đã Hoàn Thành</span>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                {completedOrders.length}
              </span>
            </h3>
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {completedOrders.length === 0 && (
                <div className="text-center text-neutral-500 py-10">
                  Chưa có đơn nào hoàn thành
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
