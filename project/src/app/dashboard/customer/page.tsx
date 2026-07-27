"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Route } from "@/routers/types";
import { BedDouble, UtensilsCrossed, ArrowRight, Clock, CheckCircle2, Flame, ChefHat, RefreshCw, Shirt } from "lucide-react";
import type { Booking } from "@/types/hotel";
import { useTranslation } from "react-i18next";
import { translateService } from "@/utils/laundry";

export default function CustomerDashboard() {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === "vn";
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myLaundryOrders, setMyLaundryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookingsAndOrders = () => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        const myBookings = data.filter((b: Booking) => b.user_id === user?.id);
        const active = myBookings.find((b: Booking) => ["CHECKED_IN", "CONFIRMED"].includes(b.status));
        setActiveBooking(active || null);

        if (active) {
          fetch(`/api/orders?booking_id=${active.id}`)
            .then((r) => r.json())
            .then((ordersData) => {
              if (Array.isArray(ordersData)) setMyOrders(ordersData);
            })
            .catch(console.error);

          fetch(`/api/laundry-bookings?booking_id=${active.id}`)
            .then((r) => r.json())
            .then((laundryData) => {
              if (Array.isArray(laundryData)) setMyLaundryOrders(laundryData);
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const updateOrderDeliveryState = async (orderId: string, newState: string, targetStatus: string) => {
    try {
      const order = myOrders.find((o) => o.id === orderId);
      let newNotes = order?.notes || "";
      newNotes = newNotes
        .replace(/\[DELIVERED_WAITING_CONFIRM\]/g, "")
        .replace(/\[CUSTOMER_NOT_RECEIVED\]/g, "")
        .replace(/\[REDO_REQUESTED_BY_RECEPTIONIST\]/g, "")
        .replace(/\[CUSTOMER_CONFIRMED\]/g, "")
        .trim();
      newNotes = newNotes ? `${newNotes}\n${newState}` : newState;

      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, notes: newNotes }),
      });
      fetchBookingsAndOrders();
    } catch (err) {
      console.error(err);
    }
  };
  const handleConfirmLaundryReady = async (orderId: string) => {
    try {
      await fetch(`/api/laundry-bookings?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS", status_text: "ready_to_receive" }),
      });
      fetchBookingsAndOrders();
    } catch (err) {
      console.error("Failed to update laundry ready status:", err);
    }
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
          <h1 className="text-3xl font-bold">{isVN ? `Chào mừng, ${user?.full_name}` : `Welcome, ${user?.full_name}`}</h1>
          <p className="text-neutral-500 mt-1">{isVN ? "Quản lý phòng ở, theo dõi trạng thái đơn gọi món và dịch vụ trực tiếp" : "Manage your stays, live order tracking and services"}</p>
        </div>
        <button
          onClick={fetchBookingsAndOrders}
          className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 transition-colors text-neutral-600 dark:text-neutral-300 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" /> {isVN ? "Làm mới" : "Refresh"}
        </button>
      </div>

      {!loading && activeBooking ? (
        <div className="space-y-6">
          {/* ACTIVE STAY CARD */}
          <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-primary-900/50 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold tracking-wider mb-4">
                {isVN ? "ĐANG LƯU TRÚ" : "ACTIVE STAY"}
              </span>
              <h3 className="text-2xl font-bold mb-2">{isVN ? "Phòng" : "Room"} {activeBooking.room?.room_number}</h3>
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
                {activeBooking.status === "CHECKED_IN" && (
                  <div className="flex flex-wrap gap-4">
                    <Link href={"/services" as Route} className="flex items-center px-6 py-3 bg-primary-6000 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                      <UtensilsCrossed className="w-5 h-5 mr-2" /> {isVN ? "Đặt dịch vụ" : "Order Service"}
                    </Link>
                    <Link href={"/laundry-services" as Route} className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                      <Shirt className="w-5 h-5 mr-2" /> {isVN ? "Dịch vụ giặt là" : "Laundry Service"}
                    </Link>
                  </div>
                )}
                <Link href={`/bookings/${activeBooking.id}` as Route} className="flex items-center px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  {isVN ? "Xem chi tiết & Hóa đơn" : "View Details & Invoice"}
                </Link>
              </div>
            </div>
          </div>

          {/* LIVE ROOM SERVICE & F&B TRACKER */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-neutral-900 dark:text-white">
                <ChefHat className="w-6 h-6 text-orange-500" />
                {isVN ? "Trạng Thái Đơn Gọi Món & Dịch Vụ Của Bạn" : "Your Service & Food Orders Status"} ({myOrders.length})
              </h3>
              <span className="text-xs font-bold text-neutral-400">{isVN ? "Tự động cập nhật trực tiếp" : "Auto updated live"}</span>
            </div>

            {myOrders.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-850/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">
                {isVN ? "Bạn chưa có đơn dịch vụ hay gọi món nào đang xử lý. Hãy nhấn Đặt dịch vụ ở trên để gọi món lên phòng!" : "You don't have any active service or food orders. Click Order Service above to order!"}
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => {
                  const isForwarded = order.notes && order.notes.includes("[FORWARDED_TO_KITCHEN]");
                  const isDelivered = order.notes && order.notes.includes("[DELIVERED_WAITING_CONFIRM]");
                  const isNotReceived = order.notes && order.notes.includes("[CUSTOMER_NOT_RECEIVED]");
                  const isRedoRequested = order.notes && order.notes.includes("[REDO_REQUESTED_BY_RECEPTIONIST]");
                  const isConfirmed = order.notes && order.notes.includes("[CUSTOMER_CONFIRMED]");
                  const estMatch = order.notes ? order.notes.match(/\[EST_TIME:\s*([^\]]+)\]/) : null;

                  let stepIndex = 1;
                  let badgeText = isVN ? "⏳ Đang chờ Lễ Tân xác nhận đơn" : "⏳ Waiting for receptionist confirmation";
                  let badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300";
                  let progressPercent = "33%";

                  if (order.status === "PENDING" && isForwarded) {
                    stepIndex = 2;
                    badgeText = isVN ? "👨‍🍳 Lễ Tân đã xác nhận — Đang chuyển xuống Nhà Bếp" : "👨‍🍳 Confirmed — Forwarding to Kitchen";
                    badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300";
                    progressPercent = "66%";
                  } else if (order.status === "IN_PROGRESS") {
                    if (isDelivered) {
                      stepIndex = 4;
                      badgeText = isVN ? "🚪 Bếp đã giao đồ — Vui lòng xác nhận nhận món" : "🚪 Delivered — Please confirm receipt";
                      badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300 animate-pulse";
                      progressPercent = "95%";
                    } else if (isNotReceived) {
                      stepIndex = 4;
                      badgeText = isVN ? "❌ Bạn báo chưa nhận được đồ — Đang chờ Lễ Tân xử lý" : "❌ Reported not received — Waiting for Receptionist";
                      badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300";
                      progressPercent = "95%";
                    } else if (isRedoRequested) {
                      stepIndex = 3;
                      badgeText = isVN ? "🔥 Lễ Tân đã yêu cầu Bếp giao lại / làm lại" : "🔥 Redo/redelivery requested";
                      badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300 animate-pulse";
                      progressPercent = "90%";
                    } else {
                      stepIndex = 3;
                      badgeText = estMatch
                        ? (isVN ? `🔥 Đầu bếp đang chế biến — ⏱️ Dự kiến hoàn thành sau: ${estMatch[1]}` : `🔥 Chef is preparing — ⏱️ Estimated time: ${estMatch[1]}`)
                        : (isVN ? "🔥 Đầu bếp đang chế biến món ăn / Đang mang lên phòng" : "🔥 Chef is preparing / Delivering to room");
                      badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300 animate-pulse";
                      progressPercent = "90%";
                    }
                  } else if (order.status === "COMPLETED") {
                    stepIndex = 5;
                    badgeText = isVN ? "✅ Bạn đã xác nhận / Hoàn thành" : "✅ Confirmed / Completed";
                    badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300";
                    progressPercent = "100%";
                  }

                  return (
                    <div key={order.id} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{isVN ? "Đơn" : "Order"} #{order.id.slice(0, 8)}</span>
                          <span className="text-xs text-neutral-400">• {new Date(order.created_at).toLocaleTimeString(isVN ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
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
                              stepIndex >= 5 ? "bg-emerald-500" : stepIndex === 4 ? "bg-purple-500 animate-pulse" : stepIndex === 3 ? "bg-orange-500 animate-pulse" : "bg-primary-6000"
                            }`}
                            style={{ width: progressPercent }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-4 text-[10px] font-bold text-neutral-400">
                          <span className={stepIndex >= 1 ? "text-primary-600 dark:text-primary-400" : ""}>{isVN ? "1. Khách gửi" : "1. Sent"}</span>
                          <span className={`text-center ${stepIndex >= 2 ? "text-orange-600 dark:text-orange-400" : ""}`}>{isVN ? "2. Lễ Tân duyệt" : "2. Approved"}</span>
                          <span className={`text-center ${stepIndex >= 3 ? "text-blue-600 dark:text-blue-400" : ""}`}>{isVN ? "3. Bếp chế biến" : "3. Preparing"}</span>
                          <span className={`text-right ${stepIndex >= 5 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{isVN ? "4. Khách nhận" : "4. Received"}</span>
                        </div>
                      </div>

                      {/* ORDER ITEMS SUMMARY */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {order.items?.map((it: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium">
                              {translateService(it.service?.name || "Service", it.service?.description, isVN).name} <strong className="text-primary-600">x{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                        <div className="font-extrabold text-primary-600 dark:text-primary-400">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(order.total_amount || 0)}
                        </div>
                      </div>

                      {order.status === "IN_PROGRESS" && isDelivered && !isConfirmed && (
                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            onClick={() => updateOrderDeliveryState(order.id, "[CUSTOMER_NOT_RECEIVED]", "IN_PROGRESS")}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
                          >
                            {isVN ? "Chưa nhận được đồ" : "Not received yet"}
                          </button>
                          <button
                            onClick={() => updateOrderDeliveryState(order.id, "[CUSTOMER_CONFIRMED]", "COMPLETED")}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> {isVN ? "Đã nhận được đồ" : "Received successfully"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LIVE LAUNDRY SERVICE TRACKER */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-neutral-900 dark:text-white">
                <Shirt className="w-6 h-6 text-indigo-500" />
                {isVN ? "Trạng Thái Yêu Cầu Giặt Là Của Bạn" : "Your Laundry Requests Status"} ({myLaundryOrders.length})
              </h3>
              <span className="text-xs font-bold text-neutral-400">{isVN ? "Tự động cập nhật trực tiếp" : "Auto updated live"}</span>
            </div>

            {myLaundryOrders.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-850/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">
                {isVN ? "Bạn chưa gửi yêu cầu giặt là nào. Hãy nhấn Dịch vụ giặt là ở trên để gửi đồ giặt!" : "You have not submitted any laundry requests. Click Laundry Service above to send clothes!"}
              </div>
            ) : (
              <div className="space-y-4">
                {myLaundryOrders.map((order) => {
                  let stepIndex = 1;
                  let badgeText = isVN ? "⏳ Đang chờ Lễ Tân xác nhận" : "⏳ Waiting for receptionist approval";
                  let badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300";
                  let progressPercent = "20%";

                  if (order.status_text === "assigned") {
                    stepIndex = 2;
                    badgeText = isVN ? "👤 Đã xác nhận — Chờ Buồng phòng thu gom đồ" : "👤 Confirmed — Waiting for Housekeeping to collect";
                    badgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300";
                    progressPercent = "40%";
                  } else if (order.status_text === "washing") {
                    stepIndex = 3;
                    badgeText = isVN ? "🌀 Buồng phòng đang mang đi giặt" : "🌀 Housekeeping is washing";
                    badgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 animate-pulse";
                    progressPercent = "60%";
                  } else if (order.status_text === "washed") {
                    stepIndex = 4;
                    badgeText = isVN ? "👕 Đã giặt xong — Hãy báo khi bạn sẵn sàng nhận đồ" : "👕 Washed — Please notify when you are ready to receive";
                    badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 animate-pulse";
                    progressPercent = "80%";
                  } else if (order.status_text === "ready_to_receive") {
                    stepIndex = 4;
                    badgeText = isVN ? "🚪 Sẵn sàng nhận đồ (Đang chờ Lễ Tân duyệt)" : "🚪 Ready to receive (Waiting for Receptionist)";
                    badgeClass = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 animate-pulse";
                    progressPercent = "85%";
                  } else if (order.status_text === "delivering") {
                    stepIndex = 4;
                    badgeText = isVN ? "🚚 Đang trả đồ (Buồng phòng đang mang lên giao cho bạn)" : "🚚 Delivering (Housekeeping on the way)";
                    badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 animate-bounce";
                    progressPercent = "95%";
                  } else if (order.status_text === "delivered") {
                    stepIndex = 5;
                    badgeText = isVN ? "✅ Đã giao đồ xong (Đã cộng vào hóa đơn phòng)" : "✅ Delivered (Charged to room debt)";
                    badgeClass = "bg-emerald-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300";
                    progressPercent = "100%";
                  } else if (order.status_text === "rejected") {
                    stepIndex = 0;
                    badgeText = isVN ? "❌ Yêu cầu bị từ chối" : "❌ Request rejected";
                    badgeClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300";
                    progressPercent = "0%";
                  }

                  return (
                    <div key={order.id} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/85 border border-neutral-200 dark:border-neutral-700 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{isVN ? "Đơn giặt đồ" : "Laundry Order"} #{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-xs text-neutral-400">• {order.service_type === "Wash & Fold" ? (isVN ? "Giặt thường" : "Wash & Fold") : order.service_type === "Dry Cleaning" ? (isVN ? "Giặt khô / Giặt hấp" : "Dry Cleaning") : (isVN ? "Chỉ ủi / là" : "Pressing Only")}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>

                      {/* PROGRESS BAR */}
                      {stepIndex > 0 && (
                        <div className="space-y-2">
                          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                stepIndex === 5 ? "bg-emerald-500" : "bg-indigo-600"
                              }`}
                              style={{ width: progressPercent }}
                            ></div>
                          </div>
                          <div className="grid grid-cols-5 text-[9px] font-bold text-neutral-400">
                            <span className={stepIndex >= 1 ? "text-indigo-600 dark:text-indigo-400" : ""}>{isVN ? "1. Khách gửi" : "1. Sent"}</span>
                            <span className={`text-center ${stepIndex >= 2 ? "text-purple-600 dark:text-purple-400" : ""}`}>{isVN ? "2. Nhận việc" : "2. Assigned"}</span>
                            <span className={`text-center ${stepIndex >= 3 ? "text-amber-600 dark:text-amber-400" : ""}`}>{isVN ? "3. Đang giặt" : "3. Washing"}</span>
                            <span className={`text-center ${stepIndex >= 4 ? "text-orange-600 dark:text-orange-400" : ""}`}>{isVN ? "4. Sẵn sàng nhận" : "4. Ready"}</span>
                            <span className={`text-right ${stepIndex >= 5 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{isVN ? "5. Hoàn thành" : "5. Completed"}</span>
                          </div>
                        </div>
                      )}

                      {/* ITEMS SUMMARY */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {order.items?.map((it: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold">
                              {translateService(it.service?.name || "Service", it.service?.description, isVN).name} <strong className="text-primary-600">x{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                        <div className="font-extrabold text-primary-600 dark:text-primary-400">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(order.total_amount || 0)}
                        </div>
                      </div>

                      {/* Ready to receive action */}
                      {order.status_text === "washed" && (
                        <div className="mt-4 flex justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                          <button
                            onClick={() => handleConfirmLaundryReady(order.id)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center gap-1.5"
                          >
                            🚪 {isVN ? "Tôi đang ở phòng (Sẵn sàng nhận đồ)" : "I am in my room (Ready to receive)"}
                          </button>
                        </div>
                      )}
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
          <h3 className="text-xl font-semibold mb-2">{isVN ? "Không có phòng đang ở" : "No Active Stays"}</h3>
          <p className="text-neutral-500 mb-6">{isVN ? "Sẵn sàng cho chuyến đi tiếp theo? Khám phá các phòng trống của chúng tôi." : "Ready for your next trip? Explore our available rooms."}</p>
          <Link href={"/rooms" as Route} className="inline-flex items-center px-6 py-3 bg-primary-6000 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
            {isVN ? "Đặt phòng ngay" : "Book a Room"} <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={"/bookings" as Route} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:shadow-md transition-shadow group">
          <h4 className="text-lg font-semibold mb-2 flex items-center justify-between">
            {isVN ? "Lịch sử đặt phòng" : "Booking History"} 
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-6000 transition-colors" />
          </h4>
          <p className="text-sm text-neutral-500">{isVN ? "Xem các phòng đã đặt trước đây và tải hóa đơn" : "View past stays and download invoices"}</p>
        </Link>
        <Link href={"/account" as Route} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:shadow-md transition-shadow group">
          <h4 className="text-lg font-semibold mb-2 flex items-center justify-between">
            {isVN ? "Thiết lập cá nhân" : "Profile Settings"} 
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-6000 transition-colors" />
          </h4>
          <p className="text-sm text-neutral-500">{isVN ? "Cập nhật thông tin tài khoản của bạn" : "Update your personal information"}</p>
        </Link>
      </div>
    </div>
  );
}
