"use client";

import React, { useState, useEffect } from "react";
import { 
  Utensils, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Wrench, 
  Plus, 
  Search, 
  DollarSign, 
  Check, 
  X, 
  Bell, 
  Coffee, 
  Shirt, 
  Home, 
  ChevronRight,
  User,
  CheckCheck,
  Car
} from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import Input from "@/shared/Input";
import type { Room, Service, ServiceOrder } from "@/types/hotel";

export default function ReceptionistServiceHub() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"ROOMS" | "ORDERS" | "CAR_RENTALS" | "EXPERIENCES">("ROOMS");
  const [filterFloor, setFilterFloor] = useState<number | "ALL">("ALL");

  // Modal State for Ordering Room Service / F&B
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedRoomForService, setSelectedRoomForService] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<{ service: Service; quantity: number }[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [serviceCategory, setServiceCategory] = useState<string>("ALL");

  const [carRentals, setCarRentals] = useState<any[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [roomsRes, servicesRes, ordersRes, carRes, bookingsRes] = await Promise.all([
        fetch("/api/rooms?all=true"),
        fetch("/api/services?all=true"),
        fetch("/api/orders?status=PENDING,IN_PROGRESS,COMPLETED"),
        fetch("/api/car-bookings"),
        fetch("/api/bookings"),
      ]);

      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        if (Array.isArray(rData) && rData.length > 0) {
          setRooms(rData);
        } else {
          setRooms(fallbackRooms);
        }
      } else {
        setRooms(fallbackRooms);
      }

      if (servicesRes.ok) {
        const sData = await servicesRes.json();
        if (Array.isArray(sData) && sData.length > 0) {
          setServices(sData);
        } else {
          setServices(fallbackServices);
        }
      } else {
        setServices(fallbackServices);
      }

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (Array.isArray(oData) && oData.length > 0) {
          setActiveOrders(oData);
        } else {
          setActiveOrders(fallbackOrders);
        }
      } else {
        setActiveOrders(fallbackOrders);
      }

      if (carRes && carRes.ok) {
        const cData = await carRes.json();
        if (Array.isArray(cData)) {
          setCarRentals(cData);
        }
      }
      if (bookingsRes && bookingsRes.ok) {
        const bData = await bookingsRes.json();
        if (Array.isArray(bData)) {
          setBookings(bData);
        }
      }
        }
      }
    } catch (err) {
      console.error("ReceptionistServiceHub fetch error:", err);
      setRooms(fallbackRooms);
      setServices(fallbackServices);
      setActiveOrders(fallbackOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fallbackRooms = [
    { id: "rm-101", room_number: "P101", floor: 1, status: "AVAILABLE", room_type: { name: "Deluxe Ocean View", base_price: 1500000 } },
    { id: "rm-102", room_number: "P102", floor: 1, status: "DIRTY", notes: "Khách vừa trả phòng lúc 12:00", room_type: { name: "Standard Garden", base_price: 950000 } },
    { id: "rm-201", room_number: "P201", floor: 2, status: "IN_USE", notes: "Khách VIP: Trần Đức Đạt (Check-out mai)", room_type: { name: "Suite Premium King", base_price: 2800000 }, current_booking_id: "BK-201" },
    { id: "rm-202", room_number: "P202", floor: 2, status: "IN_USE", notes: "Khách gia đình: Lê Thị Mai", room_type: { name: "Family King", base_price: 2200000 }, current_booking_id: "BK-202" },
    { id: "rm-301", room_number: "P301", floor: 3, status: "MAINTENANCE", notes: "Đang sửa chữa vòi nước nhà tắm", room_type: { name: "Presidential Suite", base_price: 5000000 } },
  ];

  const fallbackServices: any[] = [
    { id: "s-1", name: "Phở Bò Kobe Đặc Biệt", category: "FOOD", price: 180000, description: "Nước dùng hầm 24h thơm ngon", is_available: true },
    { id: "s-2", name: "Nước Cam Tươi Nguyên Chất", category: "BEVERAGE", price: 65000, description: "Cam tươi 100% không đường hóa học", is_available: true },
    { id: "s-3", name: "Cà Phê Trứng Hà Nội", category: "BEVERAGE", price: 55000, description: "Thơm béo ngậy truyền thống", is_available: true },
    { id: "s-4", name: "Giặt Ứi Nhanh (Set 3 đồ)", category: "LAUNDRY", price: 80000, description: "Sấy thơm trả trong 3 giờ", is_available: true },
    { id: "s-5", name: "Set Khăn Bông VIP Thêm", category: "AMENITY", price: 30000, description: "Khăn cotton 100% cao cấp", is_available: true },
  ];

  const fallbackOrders = [
    {
      id: "ORD-101",
      booking_id: "BK-201",
      status: "IN_PROGRESS",
      total_amount: 310000,
      notes: "Giao lên phòng P201 cho anh Đạt",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      room_number: "P201",
      items: [
        { service_name: "Phở Bò Kobe Đặc Biệt", quantity: 1, unit_price: 180000, subtotal: 180000 },
        { service_name: "Nước Cam Tươi Nguyên Chất", quantity: 2, unit_price: 65000, subtotal: 130000 },
      ],
    },
  ];

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );

    if (!roomId.startsWith("rm-")) {
      try {
        await fetch(`/api/rooms/${roomId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (err) {
        console.error("Sync room status error:", err);
      }
    }
  };

  const openServiceOrderingModal = (room: any) => {
    setSelectedRoomForService(room);
    setOrderItems([]);
    setOrderNotes(`Khách phòng ${room.room_number} yêu cầu`);
    setIsOrderModalOpen(true);
  };

  const addItemToOrder = (service: Service) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.service.id === service.id);
      if (existing) {
        return prev.map((i) =>
          i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeItemFromOrder = (serviceId: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.service.id === serviceId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.service.id === serviceId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.service.id !== serviceId);
    });
  };

  const totalOrderAmount = orderItems.reduce(
    (acc, item) => acc + item.service.price * item.quantity,
    0
  );

  const handleSubmitOrder = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (orderItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 món ăn hoặc dịch vụ!");
      return;
    }

    const bookingId = selectedRoomForService?.current_booking_id || "BK-DEMO";
    const finalNotes = "[FORWARDED_TO_KITCHEN] " + (orderNotes || "");
    const newOrderPayload = {
      booking_id: bookingId,
      notes: finalNotes.trim(),
      items: orderItems.map((i) => ({
        service_id: i.service.id,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrderPayload),
      });

      const newOrderUI = {
        id: "ORD-" + Math.floor(100 + Math.random() * 900),
        booking_id: bookingId,
        status: "PENDING",
        total_amount: totalOrderAmount,
        notes: finalNotes.trim(),
        created_at: new Date().toISOString(),
        room_number: selectedRoomForService?.room_number || "P-VIP",
        items: orderItems.map((i) => ({
          service_name: i.service.name,
          quantity: i.quantity,
          unit_price: i.service.price,
          subtotal: i.service.price * i.quantity,
        })),
      };

      setActiveOrders((prev) => [newOrderUI, ...prev]);
      alert(`✅ Đã tạo đơn dịch vụ & chuyển ngay xuống Nhà bếp cho Phòng ${selectedRoomForService?.room_number}! Tổng cộng: ${totalOrderAmount.toLocaleString("vi-VN")} đ.`);
      setIsOrderModalOpen(false);
    } catch (err: any) {
      alert("Lỗi tạo đơn dịch vụ: " + err.message);
    }
  };

  const handleForwardToKitchen = async (order: any) => {
    try {
      const updatedNotes = ((order.notes || "") + " [FORWARDED_TO_KITCHEN]").trim();
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING", notes: updatedNotes }),
      });
      setActiveOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, notes: updatedNotes } : o))
      );
      alert("✅ Đã duyệt đơn & chuyển xuống Nhà bếp thành công! Bếp đã nhận được thông báo reo chuông.");
    } catch (err: any) {
      alert("Lỗi duyệt đơn: " + err.message);
    }
  };

  const handleUpdateCarBookingStatus = async (cbId: string, status: string, statusText: string) => {
    try {
      const res = await fetch(`/api/car-bookings?id=${cbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, status_text: statusText }),
      });
      if (res.ok) {
        alert("✅ Đã cập nhật trạng thái thuê xe thành công!");
        fetchAllData();
      } else {
        alert("Cập nhật trạng thái thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi.");
    }
  };
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối/hủy yêu cầu gọi món này?")) return;
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert("Lỗi hủy đơn: " + err.message);
    }
  };

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  const filteredRooms = filterFloor === "ALL" ? rooms : rooms.filter((r) => r.floor === filterFloor);
  const filteredServices = serviceCategory === "ALL" ? services : services.filter((s) => s.category === serviceCategory);

  return (
    <div className="space-y-6">
      {/* Top Bar Banner for Receptionist Services */}
      <div className="bg-gradient-to-r from-primary-6000 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            <Utensils className="w-3.5 h-3.5" />
            Cổng Phục Vụ Khách Hàng & Dịch Vụ Lễ Tân (Receptionist Service Hub)
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            Điều Hành Buồng Phòng & Gọi Món Trực Tiếp
          </h2>
          <p className="text-primary-100 text-sm max-w-2xl">
            Lễ tân dễ dàng theo dõi tình trạng buồng phòng thực tế, bấm hối dọn gấp khi khách đến sớm hoặc gọi đồ ăn/thức uống/tiện ích lên phòng ghi nợ trực tiếp vào Booking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab("ROOMS")}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeSubTab === "ROOMS"
                ? "bg-white text-primary-700 shadow-lg scale-105"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Home className="w-4 h-4" />
            Sơ Đồ Phòng & Phục Vụ ({rooms.length})
          </button>
          <button
            onClick={() => setActiveSubTab("ORDERS")}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeSubTab === "ORDERS"
                ? "bg-white text-primary-700 shadow-lg scale-105"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Clock className="w-4 h-4" />
            Đơn Dịch Vụ Đang Xử Lý ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab("CAR_RENTALS")}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeSubTab === "CAR_RENTALS"
                ? "bg-white text-primary-700 shadow-lg scale-105"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Car className="w-4 h-4" />
            Dịch Vụ Thuê Xe ({carRentals.length})
          </button>
          <button
            onClick={() => setActiveSubTab("EXPERIENCES")}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeSubTab === "EXPERIENCES"
                ? "bg-white text-primary-700 shadow-lg scale-105"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Giám Sát Trải Nghiệm
          </button>
          <button onClick={fetchAllData} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors" title="Làm mới">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ROOMS GRID & INSTANT SERVICE ORDERING */}
      {activeSubTab === "ROOMS" && (
        <div className="space-y-6">
          {/* Floor Filters & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-4 md:p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-neutral-400 mr-2 uppercase">Lọc theo Tầng:</span>
              <button
                onClick={() => setFilterFloor("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterFloor === "ALL"
                    ? "bg-primary-6000 text-white shadow"
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                Tất cả ({rooms.length})
              </button>
              {floors.map((fl) => (
                <button
                  key={fl}
                  onClick={() => setFilterFloor(fl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterFloor === fl
                      ? "bg-primary-6000 text-white shadow"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  Tầng {fl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Trống Sẵn Sàng (AVAILABLE)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Đang Có Khách (IN_USE)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Chưa Dọn (DIRTY)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Bảo Trì (MAINTENANCE)</span>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const statusBorder = {
                AVAILABLE: "border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20",
                IN_USE: "border-blue-500/60 bg-blue-50/30 dark:bg-blue-950/20",
                DIRTY: "border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20",
                MAINTENANCE: "border-red-500/60 bg-red-50/30 dark:bg-red-950/20",
              };
              const statusBadge = {
                AVAILABLE: { label: "✨ Trống Sẵn Sàng", color: "bg-emerald-600 text-white" },
                IN_USE: { label: "👤 Đang Có Khách", color: "bg-blue-600 text-white" },
                DIRTY: { label: "🧹 Chờ Dọn Dẹp", color: "bg-amber-500 text-white" },
                MAINTENANCE: { label: "🔧 Bảo Trì Kỹ Thuật", color: "bg-red-600 text-white" },
              };
              const currentBadge = statusBadge[room.status as keyof typeof statusBadge] || statusBadge.AVAILABLE;

              return (
                <div key={room.id} className={`rounded-3xl border-2 p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all ${statusBorder[room.status as keyof typeof statusBorder]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl font-black text-neutral-900 dark:text-white">
                        Phòng {room.room_number}
                      </span>
                      <p className="text-xs font-bold text-neutral-500 mt-0.5">
                        {room.room_type?.name || "Deluxe Ocean"} — Tầng {room.floor}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow ${currentBadge.color}`}>
                      {currentBadge.label}
                    </span>
                  </div>

                  {room.notes && (
                    <div className="bg-white/80 dark:bg-neutral-900/80 p-3 rounded-2xl text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700 flex items-start gap-2">
                      <User className="w-4 h-4 text-primary-6000 shrink-0 mt-0.5" />
                      <div>{room.notes}</div>
                    </div>
                  )}

                  {/* Actions based on status */}
                  <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-2">
                    {room.status === "IN_USE" && (
                      <button
                        onClick={() => openServiceOrderingModal(room)}
                        className="flex-1 bg-primary-6000 hover:bg-primary-700 text-white font-extrabold py-3 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Utensils className="w-4 h-4" />
                        ➕ Gọi Món / Dịch Vụ
                      </button>
                    )}

                    {room.status === "DIRTY" && (
                      <div className="flex w-full gap-2">
                        <button
                          onClick={() => {
                            alert(`📢 Đã gửi thông báo ưu tiên dọn gấp Phòng ${room.room_number} xuống bộ phận Housekeeping!`);
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-3 rounded-2xl shadow transition-all text-xs flex items-center justify-center gap-1.5"
                        >
                          <Bell className="w-4 h-4 animate-bounce" />
                          🚨 Hối Dọn Gấp
                        </button>
                        <button
                          onClick={() => handleStatusChange(room.id, "AVAILABLE")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-2xl shadow transition-all text-xs flex items-center justify-center gap-1"
                          title="Xác nhận đã dọn xong"
                        >
                          <CheckCheck className="w-4 h-4" />
                          Xác Nhận Sạch
                        </button>
                      </div>
                    )}

                    {room.status === "AVAILABLE" && (
                      <div className="flex w-full items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-bold px-2 py-1.5">
                        <span>✨ Sẵn sàng làm Check-in cho khách</span>
                        <button
                          onClick={() => handleStatusChange(room.id, "MAINTENANCE")}
                          className="text-neutral-400 hover:text-red-500 font-normal underline text-xs"
                        >
                          Báo lỗi bảo trì
                        </button>
                      </div>
                    )}

                    {room.status === "MAINTENANCE" && (
                      <button
                        onClick={() => handleStatusChange(room.id, "AVAILABLE")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl shadow transition-all text-xs flex items-center justify-center gap-2"
                      >
                        <Wrench className="w-4 h-4" />
                        Mở Khóa (Đã Sửa Xong)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ACTIVE ORDERS QUEUE */}
      {activeSubTab === "ORDERS" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary-6000" />
              Danh Sách Yêu Cầu Dịch Vụ & Gọi Món Đang Phục Vụ ({activeOrders.length})
            </h3>
          </div>

          {activeOrders.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              Chưa có đơn dịch vụ hoặc món ăn nào đang xử lý. Khi Lễ tân gọi món cho khách, đơn sẽ hiển thị ở đây!
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const isForwarded = order.notes && order.notes.includes("[FORWARDED_TO_KITCHEN]");
                const estMatch = order.notes ? order.notes.match(/\[EST_TIME:\s*([^\]]+)\]/) : null;

                let statusColor = "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300";
                let statusText = "⏳ Chờ Lễ Tân duyệt đơn (Khách đặt từ phòng)";

                if (order.status === "PENDING" && isForwarded) {
                  statusColor = "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/40 dark:text-orange-300";
                  statusText = "👨‍🍳 Đã chuyển xuống Bếp — Chờ Chef tiếp nhận";
                } else if (order.status === "IN_PROGRESS") {
                  statusColor = "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300";
                  statusText = estMatch
                    ? `🔥 Bếp đang chế biến — Dự kiến hoàn thành: ${estMatch[1]}`
                    : "🔥 Bếp đang chế biến / Đang giao lên phòng";
                } else if (order.status === "COMPLETED") {
                  statusColor = "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300";
                  statusText = "✅ Đã chế biến xong & Giao hoàn tất";
                }

                return (
                  <div key={order.id} className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-primary-6000 text-white font-black px-3 py-1 rounded-xl text-sm">
                            Phòng {order.room_number || "P201"}
                          </span>
                          <span className="text-xs font-bold text-neutral-500">Mã đơn: #{order.id}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {order.items?.map((it: any, i: number) => (
                            <span key={i} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-xl font-bold text-sm text-neutral-800 dark:text-neutral-200">
                              {it.service_name} <strong className="text-primary-6000">x{it.quantity}</strong>
                            </span>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="text-xs text-neutral-500 italic">
                            📝 Ghi chú: {order.notes.replace(/\[FORWARDED_TO_KITCHEN\]/g, "").replace(/\[EST_TIME:[^\]]+\]/g, "").trim() || "Không có ghi chú thêm"}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-neutral-400">Tổng tiền ghi nợ phòng</div>
                        <div className="text-xl font-black text-primary-6000 dark:text-primary-400">
                          {order.total_amount.toLocaleString("vi-VN")} đ
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">Ghi lúc: {new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>

                    {order.status === "PENDING" && !isForwarded && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700 justify-end items-center">
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-300 transition-colors"
                        >
                          ❌ Từ chối / Hủy đơn
                        </button>
                        <button
                          onClick={() => handleForwardToKitchen(order)}
                          className="px-5 py-2 bg-primary-6000 text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-700 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> ✅ Duyệt & Chuyển Xuống Nhà Bếp
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* SUB-TAB 3: CAR RENTALS VERIFICATION & DISPATCH */}
      {activeSubTab === "CAR_RENTALS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Car className="w-6 h-6 text-primary-600" />
              Danh Sách Yêu Cầu Thuê Xe Tự Lái ({carRentals.length})
            </h3>
          </div>

          {carRentals.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              Chưa có yêu cầu thuê xe nào được gửi lên.
            </div>
          ) : (
            <div className="space-y-4">
              {carRentals.map((rental) => {
                const checkInCccd = rental.booking?.guest?.id_card_number || rental.booking?.user?.id_card_number || "Chưa check-in";
                const gplxCccd = rental.gplx_cccd;
                const isMatching = checkInCccd && gplxCccd && checkInCccd.trim() === gplxCccd.trim();

                let statusColor = "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300";
                let statusText = "⏳ Chờ đối chiếu duyệt GPLX (Pending)";

                if (rental.status_text === "rejected") {
                  statusColor = "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300";
                  statusText = "❌ Đã từ chối (CCCD không trùng khớp)";
                } else if (rental.status_text === "Wait for the vehicle in the lobby.") {
                  statusColor = "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300";
                  statusText = "lobby Chờ bàn giao xe ở sảnh";
                } else if (rental.status_text === "waiting to return the vehicle") {
                  statusColor = "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300";
                  statusText = "🚗 Đang thuê (Chờ trả xe)";
                } else if (rental.status_text === "return requested") {
                  statusColor = "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/40 dark:text-orange-300";
                  statusText = "⏳ Khách yêu cầu trả xe — Chờ Lễ tân nhận xe";
                } else if (rental.status_text === "returned") {
                  statusColor = "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300";
                  statusText = "✅ Đã trả xe thành công (Tiền xe đã cộng vào Bill)";
                }

                return (
                  <div key={rental.id} className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-primary-600 text-white font-black px-3 py-1 rounded-xl text-sm">
                            Phòng {rental.booking?.room?.room_number || "P101"}
                          </span>
                          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Mã: #{rental.id.split("-")[0].toUpperCase()}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 pt-2 text-sm">
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Khách hàng:</span>
                            <span className="text-neutral-850 dark:text-neutral-200 font-bold ml-1.5">{rental.booking?.user?.full_name || rental.booking?.guest?.full_name || "Guest"}</span>
                          </div>
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Xe đăng ký:</span>
                            <span className="text-neutral-855 dark:text-neutral-200 font-bold ml-1.5">{rental.car_type}</span>
                          </div>
                          <div>
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Thời gian thuê:</span>
                            <span className="text-neutral-860 dark:text-neutral-200 font-bold ml-1.5">
                              {new Date(rental.pickup_date).toLocaleDateString("vi-VN")} ➔ {new Date(rental.dropoff_date).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div className="space-y-1">
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 uppercase font-bold">Số CCCD Check-in phòng:</div>
                            <div className="text-sm font-black font-mono text-neutral-800 dark:text-neutral-200">
                              💳 {checkInCccd}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 uppercase font-bold">Số CCCD trên GPLX tự khai:</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black font-mono text-neutral-800 dark:text-neutral-200">
                                🪪 {gplxCccd || "Chưa nhập"}
                              </span>
                              {checkInCccd && gplxCccd ? (
                                isMatching ? (
                                  <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-green-200">CCCD TRÙNG KHỚP</span>
                                ) : (
                                  <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-red-200">CCCD LỆCH</span>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {rental.gplx_image && (rental.gplx_image.startsWith("data:image/") || rental.gplx_image.startsWith("http")) ? (
                          <div className="mt-2 space-y-1">
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">📂 Ảnh chụp GPLX:</span>
                            <div className="relative max-w-[240px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-md group cursor-pointer hover:shadow-lg transition-all">
                              <img 
                                src={rental.gplx_image} 
                                alt="GPLX" 
                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                onClick={() => {
                                  const win = window.open();
                                  win?.document.write(`<img src="${rental.gplx_image}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5 pt-1">
                            <span>📂 File ảnh GPLX thủ công:</span>
                            <span className="text-primary-600 underline font-bold select-all cursor-pointer">{rental.gplx_image || "gplx_manual_upload.png"}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right flex flex-col justify-between items-end gap-2">
                        <div className="space-y-0.5">
                          <div className="text-xs text-neutral-400">Giá trị thuê xe</div>
                          <div className="text-xl font-black text-red-600 dark:text-red-400">
                            {(rental.total_amount * 26320).toLocaleString("vi-VN")} đ
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">({(rental.total_amount).toLocaleString("en-US")} USD)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700 justify-end items-center">
                      {rental.status_text === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateCarBookingStatus(rental.id, "CANCELLED", "rejected")}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
                          >
                            ❌ Từ chối (CCCD không khớp)
                          </button>
                          <button
                            onClick={() => handleUpdateCarBookingStatus(rental.id, "IN_PROGRESS", "Wait for the vehicle in the lobby.")}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Duyệt GPLX & Chờ ở Sảnh
                          </button>
                        </>
                      )}

                      {rental.status_text === "Wait for the vehicle in the lobby." && (
                        <button
                          onClick={() => handleUpdateCarBookingStatus(rental.id, "IN_PROGRESS", "waiting to return the vehicle")}
                          className="px-5 py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Car className="w-4 h-4" /> 🚗 Giao xe cho Khách hàng
                        </button>
                      )}

                      {rental.status_text === "return requested" && (
                        <button
                          onClick={() => handleUpdateCarBookingStatus(rental.id, "COMPLETED", "returned")}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                        >
                          <CheckCheck className="w-4 h-4" /> ✓ Xác nhận trả xe & Ghi nợ phòng
                        </button>
                      )}

                      {rental.status_text === "waiting to return the vehicle" && (
                        <span className="text-xs text-neutral-400 font-medium italic">Khách hàng đang thuê xe. Chờ khách trả xe trên giao diện...</span>
                      )}

                      {rental.status_text === "returned" && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                          ✓ Đã thanh toán & hoàn tất bàn giao
                        </span>
                      )}

                      {rental.status_text === "rejected" && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                          ✓ Đã từ chối do lệch thông tin
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}



      {/* SUB-TAB 3: EXPERIENCES DASHBOARD */}
      {activeSubTab === "EXPERIENCES" && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
              <span>Giám Sát & Điều Hành Trải Nghiệm Khách Sạn</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Bảng theo dõi trạng thái đặt tour trải nghiệm (climbing, rowing, swimming, skiing) của tất cả các phòng lưu trú.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-extrabold">Số Phòng</th>
                  <th className="px-6 py-4 font-extrabold">Trạng Thái Phòng</th>
                  <th className="px-6 py-4 font-extrabold">Khách Đang Ở</th>
                  <th className="px-6 py-4 font-extrabold">Tour Trải Nghiệm Đã Đặt</th>
                  <th className="px-6 py-4 font-extrabold">Kênh Đặt</th>
                  <th className="px-6 py-4 font-extrabold">Thanh Toán</th>
                  <th className="px-6 py-4 font-extrabold text-right">Tổng Chi Phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {rooms.map((room) => {
                  const currentBooking = bookings.find(b => b.room_id === room.id && b.status === "CHECKED_IN");
                  
                  // Gather online experience bookings
                  const onlineExps = bookings.filter(b => 
                    b.room_id === room.id && 
                    b.status !== "CANCELLED" && 
                    b.special_requests && 
                    (() => {
                      try {
                        const parsed = JSON.parse(b.special_requests);
                        return parsed && parsed.isExperience === true;
                      } catch (e) { return false; }
                    })()
                  );

                  // Gather counter experience orders
                  const counterExps: any[] = [];
                  if (currentBooking) {
                    const roomOrders = activeOrders.filter(o => o.booking_id === currentBooking.id);
                    roomOrders.forEach(o => {
                      o.items?.forEach((item: any) => {
                        const nameLower = (item.service_name || "").toLowerCase();
                        if (nameLower.includes("experience") || nameLower.includes("tour") || nameLower.includes("leo núi") || nameLower.includes("chèo thuyền") || nameLower.includes("tắm biển") || nameLower.includes("trượt tuyết")) {
                          counterExps.push({
                            id: o.id,
                            name: item.service_name,
                            qty: item.quantity,
                            status: o.status,
                            price: item.subtotal || (item.unit_price * item.quantity)
                          });
                        }
                      });
                    });
                  }

                  const hasExp = onlineExps.length > 0 || counterExps.length > 0;
                  const guestName = currentBooking?.user?.full_name || currentBooking?.guest?.full_name || "-";

                  return (
                    <tr key={room.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">
                        Phòng {room.room_number}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          room.status === "AVAILABLE" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" :
                          room.status === "IN_USE" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                          room.status === "DIRTY" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">
                        {guestName}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {!hasExp && <span className="text-neutral-400 text-xs">Chưa đặt trải nghiệm</span>}
                        {onlineExps.map((b: any) => {
                          let title = "Tour Trải nghiệm";
                          try {
                            const parsed = JSON.parse(b.special_requests);
                            title = parsed.title || title;
                          } catch (e) {}
                          return (
                            <div key={b.id} className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                              🧗 {title}
                            </div>
                          );
                        })}
                        {counterExps.map((item: any, idx: number) => (
                          <div key={idx} className="font-bold text-indigo-600 dark:text-indigo-400">
                            🛎️ {item.name} <span className="text-xs text-neutral-400 font-normal">x{item.qty}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                        {onlineExps.map((b: any) => <div key={b.id}>Đặt trực tuyến</div>)}
                        {counterExps.map((item: any, idx: number) => <div key={idx}>Tại quầy lễ tân</div>)}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {onlineExps.map((b: any) => (
                          <div key={b.id}>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
                              Đã thanh toán (Online)
                            </span>
                          </div>
                        ))}
                        {counterExps.map((item: any, idx: number) => {
                          const isPaid = item.status === "COMPLETED";
                          return (
                            <div key={idx}>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isPaid 
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}>
                                {isPaid ? "Đã thanh toán" : "Ghi nợ phòng (Chờ thanh toán)"}
                              </span>
                            </div>
                          );
                        })}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-neutral-900 dark:text-white">
                        {onlineExps.map((b: any) => <div key={b.id}>{(b.total_amount || 0).toLocaleString("vi-VN")} đ</div>)}
                        {counterExps.map((item: any, idx: number) => <div key={idx}>{(item.price || 0).toLocaleString("vi-VN")} đ</div>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ORDER ROOM SERVICE / F&B FOR GUEST */}
      {isOrderModalOpen && selectedRoomForService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
              <div>
                <h3 className="text-xl font-extrabold flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-primary-500" />
                  Gọi Món F&B & Dịch Vụ Cho Phòng {selectedRoomForService.room_number}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Khách hàng: {selectedRoomForService.notes?.split(":")?.[1] || "Khách VIP đang lưu trú"} — Chi phí sẽ được tự động cộng vào hóa đơn Check-out.
                </p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setServiceCategory("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    serviceCategory === "ALL" ? "bg-primary-6000 text-white" : "bg-neutral-100 dark:bg-neutral-700"
                  }`}
                >
                  Tất cả
                </button>
                {["FOOD", "BEVERAGE", "LAUNDRY", "AMENITY", "OTHER"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setServiceCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      serviceCategory === cat ? "bg-primary-6000 text-white" : "bg-neutral-100 dark:bg-neutral-700"
                    }`}
                  >
                    {cat === "FOOD" && "🍲 Đồ ăn"}
                    {cat === "BEVERAGE" && "🍹 Thức uống"}
                    {cat === "LAUNDRY" && "👔 Giặt ủi"}
                    {cat === "AMENITY" && "🧼 Tiện ích"}
                    {cat === "OTHER" && "🧗 Trải nghiệm & Khác"}
                  </button>
                ))}
              </div>

              {/* Services List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredServices.map((srv) => (
                  <div key={srv.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-neutral-900 dark:text-white">{srv.name}</div>
                      <div className="text-xs font-bold text-primary-6000 mt-0.5">{srv.price.toLocaleString("vi-VN")} đ</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItemToOrder(srv)}
                      className="p-2 rounded-xl bg-primary-6000 hover:bg-primary-700 text-white transition-all shadow"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Selected Order Items Summary */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>🛒 Các Món / Dịch Vụ Đã Chọn ({orderItems.length})</span>
                  <span className="text-primary-6000 font-extrabold">{totalOrderAmount.toLocaleString("vi-VN")} đ</span>
                </h4>

                {orderItems.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs text-neutral-400">
                    Chưa chọn món nào. Bấm dấu (+) phía trên để thêm món vào đơn!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.service.id} className="flex items-center justify-between bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div>
                          <span className="font-bold text-sm">{item.service.name}</span>
                          <span className="text-xs text-neutral-400 block">{item.service.price.toLocaleString("vi-VN")} đ / đơn vị</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => removeItemFromOrder(item.service.id)}
                            className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-sm w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => addItemToOrder(item.service)}
                            className="w-7 h-7 rounded-lg bg-primary-6000 text-white flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ghi chú cho Bếp & Nhân viên giao phòng
                </label>
                <Input
                  placeholder="Ví dụ: Giao gấp cùng nước đá, ít đường..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400">Tổng cộng thanh toán</span>
                <div className="text-2xl font-black text-primary-6000 dark:text-primary-400">
                  {totalOrderAmount.toLocaleString("vi-VN")} đ
                </div>
              </div>

              <div className="flex gap-3">
                <ButtonThird type="button" onClick={() => setIsOrderModalOpen(false)}>Hủy</ButtonThird>
                <ButtonPrimary type="button" onClick={() => handleSubmitOrder()} disabled={orderItems.length === 0}>
                  Xác Nhận & Ghi Nợ Vào Phòng
                </ButtonPrimary>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
