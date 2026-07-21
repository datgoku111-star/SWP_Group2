"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Route } from "@/routers/types";
import { BedDouble, UtensilsCrossed, ArrowRight, Clock, CheckCircle2, Flame, ChefHat, RefreshCw } from "lucide-react";
import type { Booking } from "@/types/hotel";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookingsAndOrders = () => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        const myBookings = data.filter((b: Booking) => b.user_id === user?.id);
        const active = myBookings.find((b: Booking) => ["CHECKED_IN", "CONFIRMED"].includes(b.status));
        setActiveBooking(active || null);

        if (active) {
          fetch(`/api/orders?bookingId=${active.id}`)
            .then((r) => r.json())
            .then((ordersData) => {
              if (Array.isArray(ordersData)) setMyOrders(ordersData);
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookingsAndOrders();
    const interval = setInterval(fetchBookingsAndOrders, 12000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.full_name}</h1>
          <p className="text-neutral-500 mt-1">Manage your stays, live order tracking and services</p>
        </div>
        <button
          onClick={fetchBookingsAndOrders}
          className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 transition-colors text-neutral-600 dark:text-neutral-300 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {!loading && activeBooking ? (
        <div className="space-y-6">
          {/* ACTIVE STAY CARD */}
          <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-primary-900/50 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold tracking-wider mb-4">
                ACTIVE STAY
              </span>
              <h3 className="text-2xl font-bold mb-2">Room {activeBooking.room?.room_number}</h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">{activeBooking.room?.room_type?.name}</p>

              <div className="flex gap-8 mb-8">
                <div>
                  <p className="text-sm text-neutral-500">Check-in</p>
                  <p className="font-semibold">{activeBooking.check_in_date}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Check-out</p>
                  <p className="font-semibold">{activeBooking.check_out_date}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href={"/services" as Route} className="flex items-center px-6 py-3 bg-primary-6000 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                  <UtensilsCrossed className="w-5 h-5 mr-2" /> Order Service
                </Link>
                <Link href={`/bookings/${activeBooking.id}` as Route} className="flex items-center px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  View Details & Invoice
                </Link>
              </div>
            </div>
          </div>

          {/* LIVE ROOM SERVICE & F&B TRACKER */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-neutral-900 dark:text-white">
                <ChefHat className="w-6 h-6 text-orange-500" />
                Trang Thái Đơn Gọi Món & Dịch Vụ Của Bạn ({myOrders.length})
              </h3>
              <span className="text-xs font-bold text-neutral-400">Tự động cập nhật trực tiếp</span>
            </div>

            {myOrders.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-850/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">
                Bạn chưa có đơn dịch vụ hay gọi món nào đang xử lý. Hãy nhấn <strong>Order Service</strong> ở trên để gọi món lên phòng!
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => {
                  const isForwarded = order.notes && order.notes.includes("[FORWARDED_TO_KITCHEN]");
                  const estMatch = order.notes ? order.notes.match(/\[EST_TIME:\s*([^\]]+)\]/) : null;

                  let stepIndex = 1;
                  let badgeText = "⏳ Đang chờ Lễ Tân xác nhận đơn";
                  let badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300";
                  let progressPercent = "33%";

                  if (order.status === "PENDING" && isForwarded) {
                    stepIndex = 2;
                    badgeText = "👨‍🍳 Lễ Tân đã xác nhận — Đang chuyển xuống Nhà Bếp";
                    badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300";
                    progressPercent = "66%";
                  } else if (order.status === "IN_PROGRESS") {
                    stepIndex = 3;
                    badgeText = estMatch
                      ? `🔥 Đầu bếp đang chế biến — ⏱️ Dự kiến hoàn thành sau: ${estMatch[1]}`
                      : "🔥 Đầu bếp đang chế biến món ăn / Đang mang lên phòng";
                    badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300 animate-pulse";
                    progressPercent = "90%";
                  } else if (order.status === "COMPLETED") {
                    stepIndex = 4;
                    badgeText = "✅ Món ăn đã chế biến xong & Phục vụ hoàn tất!";
                    badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300";
                    progressPercent = "100%";
                  }

                  return (
                    <div key={order.id} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Đơn #{order.id.slice(0, 8)}</span>
                          <span className="text-xs text-neutral-400">• {new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>

                      {/* WORKFLOW PROGRESS STEPS */}
                      <div className="space-y-2">
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              stepIndex === 4 ? "bg-emerald-500" : stepIndex === 3 ? "bg-orange-500 animate-pulse" : "bg-primary-6000"
                            }`}
                            style={{ width: progressPercent }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-3 text-[11px] font-bold text-neutral-400">
                          <span className={stepIndex >= 1 ? "text-primary-600 dark:text-primary-400" : ""}>1. Khách gửi Lễ Tân</span>
                          <span className={`text-center ${stepIndex >= 2 ? "text-orange-600 dark:text-orange-400" : ""}`}>2. Lễ Tân duyệt & chuyển Bếp</span>
                          <span className={`text-right ${stepIndex >= 3 ? "text-blue-600 dark:text-blue-400" : ""}`}>3. Bếp chế biến & Báo giờ</span>
                        </div>
                      </div>

                      {/* ORDER ITEMS SUMMARY */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {order.items?.map((it: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium">
                              {it.service?.name} <strong className="text-primary-600">x{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                        <div className="font-extrabold text-primary-600 dark:text-primary-400">
                          {order.total_amount?.toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : !loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-10 rounded-2xl text-center">
          <BedDouble className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Stays</h3>
          <p className="text-neutral-500 mb-6">Ready for your next trip? Explore our available rooms.</p>
          <Link href={"/rooms" as Route} className="inline-flex items-center px-6 py-3 bg-primary-6000 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
            Book a Room <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={"/bookings" as Route} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:shadow-md transition-shadow group">
          <h4 className="text-lg font-semibold mb-2 flex items-center justify-between">
            Booking History 
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-6000 transition-colors" />
          </h4>
          <p className="text-sm text-neutral-500">View past stays and download invoices</p>
        </Link>
        <Link href={"/account" as Route} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:shadow-md transition-shadow group">
          <h4 className="text-lg font-semibold mb-2 flex items-center justify-between">
            Profile Settings 
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-6000 transition-colors" />
          </h4>
          <p className="text-sm text-neutral-500">Update your personal information</p>
        </Link>
      </div>
    </div>
  );
}
