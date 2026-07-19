"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import Link from "next/link";
import { 
  Calendar, 
  Key, 
  Utensils, 
  Car, 
  Compass, 
  Shirt, 
  Bell, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import type { Booking, ServiceOrder } from "@/types/hotel";

interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  description: string;
  category: "checkin" | "checkout" | "food" | "car" | "tour" | "laundry" | "amenity" | "other";
  status?: string;
  rawTime: Date;
}

export default function AccountSchedulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/account-schedule" as Route);
      return;
    }

    if (user) {
      fetchBookings();
    }
  }, [user, isLoading, router]);

  const fetchBookings = async () => {
    try {
      setPageLoading(true);
      setError("");
      const res = await fetch("/api/bookings");
      if (!res.ok) {
        throw new Error("Không thể lấy danh sách phòng đã đặt");
      }
      const data: Booking[] = await res.json();
      
      // Filter out cancelled bookings for schedule
      const activeBookings = data.filter(b => b.status !== "CANCELLED");
      setBookings(activeBookings);
      
      if (activeBookings.length > 0) {
        // Default to the first booking (or the checked-in one if exists)
        const checkedInBooking = activeBookings.find(b => b.status === "CHECKED_IN");
        setSelectedBooking(checkedInBooking || activeBookings[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBooking) {
      fetchOrders(selectedBooking.id);
    } else {
      setOrders([]);
    }
  }, [selectedBooking]);

  const fetchOrders = async (bookingId: string) => {
    try {
      setOrdersLoading(true);
      const res = await fetch(`/api/orders?booking_id=${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleBookingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookingId = e.target.value;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
    }
  };

  // Build the chronological timeline
  const getTimelineEvents = (): TimelineEvent[] => {
    if (!selectedBooking) return [];

    const events: TimelineEvent[] = [];

    // 1. Check-in event
    const checkInDate = new Date(selectedBooking.check_in_date);
    // Set simulated check-in time to 14:00 (02:00 PM)
    const checkInDateTime = new Date(checkInDate);
    checkInDateTime.setHours(14, 0, 0, 0);

    events.push({
      id: "checkin",
      date: selectedBooking.check_in_date,
      time: "14:00 (02:00 PM)",
      title: "Nhận phòng (Check-in)",
      description: `Phòng số ${selectedBooking.room?.room_number} - Tầng ${selectedBooking.room?.floor} (${selectedBooking.room?.room_type?.name})`,
      category: "checkin",
      rawTime: checkInDateTime
    });

    // 2. Service orders events
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at || new Date());
      const dateString = orderDate.toISOString().split("T")[0];
      const timeString = orderDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      order.items?.forEach((item: any) => {
        const service = item.service;
        if (!service) return;

        let category: TimelineEvent["category"] = "other";
        let title = service.name;
        let desc = `Số lượng: ${item.quantity}`;

        const nameLower = service.name.toLowerCase();
        const categoryLower = (service.category || "").toLowerCase();

        // Categorize based on service properties
        if (categoryLower === "food" || categoryLower === "beverage") {
          category = "food";
          title = `Giao đồ ăn/uống: ${service.name}`;
        } else if (categoryLower === "laundry") {
          category = "laundry";
          title = `Dịch vụ giặt ủi: ${service.name}`;
        } else if (categoryLower === "amenity") {
          category = "amenity";
          title = `Yêu cầu tiện ích: ${service.name}`;
        } else if (
          nameLower.includes("xe") || 
          nameLower.includes("car") || 
          nameLower.includes("transfer") || 
          nameLower.includes("shuttle")
        ) {
          category = "car";
          title = `Thuê xe / Đưa đón: ${service.name}`;
        } else if (
          nameLower.includes("tour") || 
          nameLower.includes("massage") || 
          nameLower.includes("spa") || 
          nameLower.includes("trải nghiệm") || 
          nameLower.includes("experience") ||
          categoryLower === "other"
        ) {
          category = "tour";
          title = `Hoạt động trải nghiệm: ${service.name}`;
        }

        if (order.notes) {
          desc += ` | Ghi chú: "${order.notes}"`;
        }

        events.push({
          id: `${order.id}-${item.id}`,
          date: dateString,
          time: timeString,
          title,
          description: desc,
          category,
          status: order.status,
          rawTime: orderDate
        });
      });
    });

    // 3. Check-out event
    const checkOutDate = new Date(selectedBooking.check_out_date);
    // Set simulated check-out time to 12:00 (12:00 PM)
    const checkOutDateTime = new Date(checkOutDate);
    checkOutDateTime.setHours(12, 0, 0, 0);

    events.push({
      id: "checkout",
      date: selectedBooking.check_out_date,
      time: "12:00 (12:00 PM)",
      title: "Trả phòng (Check-out)",
      description: "Hoàn tất thủ tục trả phòng và thanh toán các dịch vụ phát sinh.",
      category: "checkout",
      rawTime: checkOutDateTime
    });

    // Sort events chronologically
    return events.sort((a, b) => a.rawTime.getTime() - b.rawTime.getTime());
  };

  const getEventIcon = (category: TimelineEvent["category"]) => {
    switch (category) {
      case "checkin":
        return <Key className="w-5 h-5" />;
      case "checkout":
        return <Calendar className="w-5 h-5" />;
      case "food":
        return <Utensils className="w-5 h-5" />;
      case "car":
        return <Car className="w-5 h-5" />;
      case "tour":
        return <Compass className="w-5 h-5" />;
      case "laundry":
        return <Shirt className="w-5 h-5" />;
      case "amenity":
        return <Bell className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventStyles = (category: TimelineEvent["category"]) => {
    switch (category) {
      case "checkin":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
          badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300",
          border: "border-emerald-400"
        };
      case "checkout":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
          badge: "bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300",
          border: "border-rose-400"
        };
      case "food":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
          badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300",
          border: "border-amber-400"
        };
      case "car":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
          badge: "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300",
          border: "border-purple-400"
        };
      case "tour":
        return {
          bg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
          badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300",
          border: "border-indigo-400"
        };
      case "laundry":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
          badge: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300",
          border: "border-cyan-400"
        };
      case "amenity":
        return {
          bg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
          badge: "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300",
          border: "border-teal-400"
        };
      default:
        return {
          bg: "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
          badge: "bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300",
          border: "border-neutral-400"
        };
    }
  };

  const formatVietnameseDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getOrderStatusBadge = (status?: string) => {
    if (!status) return null;
    let colorClass = "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";
    if (status === "PENDING") {
      colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    } else if (status === "IN_PROGRESS") {
      colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    } else if (status === "COMPLETED") {
      colorClass = "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    } else if (status === "CANCELLED") {
      colorClass = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    }
    return (
      <span className={`text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
        {status}
      </span>
    );
  };

  if (pageLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse">
        <h2 className="text-3xl font-semibold">Lịch trình dịch vụ</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-64"></div>
        <div className="space-y-4 pt-10">
          <div className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
          <div className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
          <div className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <h2 className="text-3xl font-semibold">Lịch trình dịch vụ</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <h2 className="text-3xl font-semibold">Lịch trình dịch vụ</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm max-w-xl mx-auto px-6">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Không tìm thấy phòng đặt</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm mx-auto text-sm">
            Bạn hiện chưa có phòng đặt hoạt động nào. Hãy đặt phòng khách sạn và trải nghiệm dịch vụ của chúng tôi!
          </p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary-6000 text-white rounded-full font-medium hover:bg-primary-700 transition-colors shadow-sm text-sm">
            Đặt phòng ngay <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  const timelineEvents = getTimelineEvents();
  const serviceOrdersCount = orders.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold">Lịch trình dịch vụ</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Xem dòng thời gian trải nghiệm dịch vụ của bạn trong suốt kỳ lưu trú
          </p>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700 sm:hidden"></div>
        
        {/* Dropdown Selector */}
        <div className="flex-shrink-0 flex items-center space-x-3">
          <label htmlFor="booking-select" className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Chọn phòng đặt:
          </label>
          <select
            id="booking-select"
            value={selectedBooking?.id || ""}
            onChange={handleBookingChange}
            className="block rounded-xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-800 text-sm font-medium pr-10"
          >
            {bookings.map(b => (
              <option key={b.id} value={b.id}>
                Phòng {b.room?.room_number} ({b.check_in_date} → {b.check_out_date})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full border-b border-neutral-200 dark:border-neutral-800"></div>

      {/* ROOM OVERVIEW & SUMMARY CARD */}
      {selectedBooking && (
        <div className="p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 dark:bg-neutral-700 text-primary-6000 dark:text-neutral-200">
                Phòng {selectedBooking.room?.room_number}
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 uppercase">
                Trạng thái: {selectedBooking.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              {selectedBooking.room?.room_type?.name || "Standard Room"}
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
              Thời gian: <strong>{formatVietnameseDate(selectedBooking.check_in_date)}</strong> đến <strong>{formatVietnameseDate(selectedBooking.check_out_date)}</strong>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch md:items-center">
            <div className="text-left md:text-right md:pr-4 md:border-r border-neutral-200 dark:border-neutral-700">
              <span className="text-xs text-neutral-400 block">Dịch vụ đã đặt</span>
              <strong className="text-lg text-primary-6000">{serviceOrdersCount} đơn hàng</strong>
            </div>
            <Link 
              href="/services" 
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-6000 hover:bg-primary-700 text-white rounded-full font-medium text-xs md:text-sm shadow-sm transition-all"
            >
              Đặt thêm dịch vụ <ChevronRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      )}

      {/* TIMELINE CONTAINER */}
      <div className="relative pt-6 max-w-4xl mx-auto">
        {ordersLoading ? (
          <div className="text-center py-20 text-neutral-500">Đang tải lịch trình dịch vụ...</div>
        ) : timelineEvents.length === 2 ? (
          /* Empty Services Itinerary State */
          <div className="text-center py-16 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700 px-6">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium mb-1">Chưa có dịch vụ nào</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
              Nhận phòng lúc {selectedBooking?.check_in_date} và trả phòng lúc {selectedBooking?.check_out_date}. Bạn chưa đăng ký dịch vụ ăn uống, giặt ủi hay xe đưa đón nào cho kỳ lưu trú này.
            </p>
            <Link href="/services" className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-6000 text-white rounded-full font-semibold hover:bg-primary-700 text-xs shadow-sm transition-colors">
              Đặt dịch vụ ngay
            </Link>
          </div>
        ) : (
          /* Vertical Timeline Layout */
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 md:left-8 top-6 bottom-6 w-0.5 bg-neutral-200 dark:bg-neutral-700"></div>

            <div className="space-y-10">
              {timelineEvents.map((event, index) => {
                const styles = getEventStyles(event.category);
                
                return (
                  <div key={event.id} className="relative flex items-start pl-16 md:pl-20 group transition-all duration-300">
                    
                    {/* Node Dot & Icon */}
                    <div className={`absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full border-2 bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110 ${styles.bg}`}>
                      {getEventIcon(event.category)}
                    </div>

                    {/* Timeline Content Card */}
                    <div className="flex-grow bg-white dark:bg-neutral-800 p-5 md:p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${styles.badge}`}>
                          {event.time} - {event.date}
                        </span>
                        {event.status && getOrderStatusBadge(event.status)}
                      </div>
                      
                      <h4 className="font-bold text-base md:text-lg text-neutral-900 dark:text-neutral-100 mb-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
