"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { ShoppingCart, Plus, Minus, Trash2, X, Shirt, Info, FileText } from "lucide-react";
import type { Service, Booking } from "@/types/hotel";
import { useTranslation } from "react-i18next";

export default function LaundryServicesPage() {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === "vn";
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [laundryServices, setLaundryServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");

  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [serviceType, setServiceType] = useState<"Wash & Fold" | "Dry Cleaning" | "Pressing Only">("Wash & Fold");
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/laundry-services" as Route);
      return;
    }

    if (user) {
      fetchLaundryServices();
      fetchActiveBookings();
    }
  }, [user, isLoading, router]);

  const fetchLaundryServices = async () => {
    try {
      const res = await fetch("/api/services?category=LAUNDRY");
      if (res.ok) {
        const data = await res.json();
        setLaundryServices(data);
      }
    } catch (err) {
      console.error("Failed to fetch laundry services:", err);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        // Lọc các booking có trạng thái CHECKED_IN của chính khách hàng này
        const activeBookings = data.filter(
          (b: Booking) => b.user_id === user?.id && b.status === "CHECKED_IN"
        );
        setBookings(activeBookings);
        if (activeBookings.length > 0) {
          setSelectedBookingId(activeBookings[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch active bookings:", err);
    }
  };

  const addToCart = (serviceId: string) => {
    setCart((prev) => ({ ...prev, [serviceId]: (prev[serviceId] || 0) + 1 }));
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[serviceId] > 1) {
        newCart[serviceId]--;
      } else {
        delete newCart[serviceId];
      }
      return newCart;
    });
  };

  const clearItemFromCart = (serviceId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[serviceId];
      return newCart;
    });
  };

  // Tính hệ số nhân theo dịch vụ
  const getMultiplier = () => {
    if (serviceType === "Dry Cleaning") return 1.5;
    if (serviceType === "Pressing Only") return 0.8;
    return 1.0;
  };

  const multiplier = getMultiplier();
  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  
  // Tính tổng số tiền
  const baseTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const service = laundryServices.find((s) => s.id === id);
    return total + (service ? service.price * qty : 0);
  }, 0);
  
  const finalTotal = Math.round(baseTotal * multiplier);

  const handleSubmitOrder = async () => {
    if (!selectedBookingId) {
      setError(isVN ? "Vui lòng chọn phòng lưu trú để giao nhận quần áo." : "Please select a room to receive clothes.");
      return;
    }

    setSubmitLoading(true);
    setError("");
    setSuccess("");

    try {
      const cartEntries = Object.entries(cart);
      if (cartEntries.length === 0) {
        setError(isVN ? "Giỏ hàng của bạn đang trống." : "Your cart is empty.");
        setSubmitLoading(false);
        return;
      }

      const itemsToSubmit = cartEntries.map(([service_id, quantity]) => ({
        service_id,
        quantity,
      }));

      const selectedB = bookings.find((b) => b.id === selectedBookingId);
      const roomNum = selectedB?.room?.room_number || "P-VIP";

      const res = await fetch("/api/laundry-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBookingId,
          service_type: serviceType,
          items: itemsToSubmit,
          room_number: roomNum,
          customer_notes: notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || (isVN ? "Không thể gửi yêu cầu giặt là." : "Cannot send laundry request."));
      }

      setCart({});
      setNotes("");
      setIsCartOpen(false);
      setSuccess(isVN ? "✅ Đã gửi yêu cầu giặt đồ thành công! Vui lòng đợi nhân viên Lễ Tân duyệt." : "✅ Laundry request sent successfully! Please wait for Receptionist approval.");
      
      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        router.push("/dashboard/customer" as Route);
      }, 2000);
    } catch (err: any) {
      setError(err.message || (isVN ? "Đã xảy ra lỗi khi đặt dịch vụ." : "An error occurred while booking the service."));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500 font-semibold">{isVN ? "Đang tải..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="container py-16 mb-24 lg:mb-32 relative max-w-6xl mx-auto px-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white flex items-center gap-3">
            <Shirt className="w-10 h-10 text-primary-6000 animate-pulse" />
            {isVN ? "Dịch Vụ Giặt Là (Laundry Services)" : "Laundry Services"}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {isVN ? "Chọn loại quần áo và dịch vụ phù hợp để chúng tôi chăm sóc tốt nhất cho trang phục của bạn." : "Choose the right clothes and services so we can best care for your garments."}
          </p>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-4 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 rounded-2xl hover:bg-primary-100 transition-all shadow-sm flex items-center gap-2 border border-primary-100 dark:border-primary-900"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold text-sm hidden sm:inline">{isVN ? "Giỏ đồ giặt" : "Laundry Cart"}</span>
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow animate-bounce">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {success && (
        <div className="p-4 mb-8 bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:text-green-300 rounded-2xl text-sm font-bold flex items-center gap-2">
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-8 bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/30 dark:text-red-300 rounded-2xl text-sm font-bold flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Info Alert on multipliers */}
      <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-3xl text-sm text-blue-800 dark:text-blue-300 mb-8 flex gap-3.5">
        <Info className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold">{isVN ? "Thông tin loại hình dịch vụ giặt là:" : "Laundry service types information:"}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <li><strong>{isVN ? "Giặt thường (Wash & Fold):" : "Wash & Fold:"}</strong> {isVN ? "Làm sạch, làm khô và gấp gọn tiêu chuẩn. Giữ nguyên giá gốc (hệ số 1.0x)." : "Clean, dry and fold standard. Base price (1.0x multiplier)."}</li>
            <li><strong>{isVN ? "Chỉ ủi / là (Pressing Only):" : "Pressing Only:"}</strong> {isVN ? "Làm phẳng quần áo không qua giặt. Tiết kiệm hơn (hệ số 0.8x)." : "Pressing clothes without washing. Save more (0.8x multiplier)."}</li>
            <li><strong>{isVN ? "Giặt khô / Giặt hấp (Dry Cleaning):" : "Dry Cleaning:"}</strong> {isVN ? "Làm sạch với dung môi chuyên dụng cho đồ cao cấp, vest, len dạ (hệ số 1.5x)." : "Clean with specialized solvents for high-end clothes, vests, wool (1.5x multiplier)."}</li>
          </ul>
        </div>
      </div>

      {/* Services Grid Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laundryServices.map((service) => {
          const count = cart[service.id] || 0;
          return (
            <div
              key={service.id}
              className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-lg transition-all flex flex-col justify-between h-full group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-200 group-hover:text-primary-6000 transition-colors">
                    {service.name.replace("Laundry - ", "")}
                  </h3>
                  <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-[10px] uppercase font-black tracking-wider text-neutral-500">
                    {service.category}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
                  {service.description || (isVN ? "Dịch vụ giặt ủi và sấy khô chất lượng cao đảm bảo vệ sinh." : "High quality laundry and drying services to ensure hygiene.")}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase font-bold">{isVN ? "Giá gốc:" : "Base price:"}</span>
                  <span className="font-extrabold text-primary-6000 text-lg">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(service.price)}
                  </span>
                </div>

                {count > 0 ? (
                  <div className="flex items-center space-x-3 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2.5 py-1">
                    <button
                      onClick={() => removeFromCart(service.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shadow hover:bg-neutral-50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-extrabold w-5 text-center text-neutral-800 dark:text-neutral-200">
                      {count}
                    </span>
                    <button
                      onClick={() => addToCart(service.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shadow hover:bg-neutral-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(service.id)}
                    className="px-4 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 flex items-center gap-1 text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" /> {isVN ? "Thêm đồ" : "Add item"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="absolute top-0 right-0 max-w-md w-full h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col transform transition-all duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900">
              <h3 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Shirt className="w-5 h-5 text-primary-6000" />
                {isVN ? "Giỏ Đồ Giặt Của Bạn" : "Your Laundry Cart"}
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Body - Items list */}
            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar space-y-6">
              {cartItemsCount === 0 ? (
                <div className="text-center text-neutral-500 py-20 space-y-3">
                  <Shirt className="w-12 h-12 text-neutral-300 mx-auto" />
                  <p className="font-semibold">{isVN ? "Giỏ đồ giặt trống." : "Laundry cart is empty."}</p>
                  <p className="text-xs text-neutral-450">{isVN ? "Vui lòng chọn loại quần áo cần giặt bên ngoài." : "Please select the type of clothes to wash outside."}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{isVN ? "Danh sách đã chọn:" : "Selected list:"}</div>
                  <div className="space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {Object.entries(cart).map(([id, qty]) => {
                      const service = laundryServices.find((s) => s.id === id);
                      if (!service) return null;
                      const adjustedPrice = Math.round(service.price * multiplier);
                      return (
                        <div key={id} className="flex justify-between items-center pt-3 first:pt-0">
                          <div>
                            <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                              {service.name.replace("Laundry - ", "")}
                            </h4>
                            <span className="text-xs text-neutral-500 dark:text-neutral-450 font-medium">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(adjustedPrice)} x {qty}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-extrabold text-sm text-neutral-850 dark:text-neutral-150">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(adjustedPrice * qty)}
                            </span>
                            <button
                              onClick={() => clearItemFromCart(id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer - Configurations & Submit */}
            {cartItemsCount > 0 && (
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/30 space-y-5">
                {/* Select Service Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    {isVN ? "Loại hình giặt là:" : "Laundry service type:"}
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="block w-full text-sm rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-primary-500 focus:border-primary-500 py-2.5 font-bold text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="Wash & Fold">{isVN ? "Giặt thường (Wash & Fold) [x1.0]" : "Wash & Fold [x1.0]"}</option>
                    <option value="Dry Cleaning">{isVN ? "Giặt hấp/Giặt khô (Dry Cleaning) [x1.5]" : "Dry Cleaning [x1.5]"}</option>
                    <option value="Pressing Only">{isVN ? "Chỉ ủi/là (Pressing Only) [x0.8]" : "Pressing Only [x0.8]"}</option>
                  </select>
                </div>

                {/* Selected Room */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    {isVN ? "Phòng nhận & trả quần áo:" : "Room to receive & return clothes:"}
                  </label>
                  {bookings.length > 0 ? (
                    <select
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="block w-full text-sm rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-primary-500 focus:border-primary-500 py-2.5 font-bold text-neutral-800 dark:text-neutral-200"
                    >
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {isVN ? "Phòng" : "Room"} {b.room?.room_number} ({isVN ? "Đang ở" : "Staying"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/50">
                      {isVN ? "⚠️ Bạn cần check-in ở phòng để sử dụng dịch vụ này!" : "⚠️ You need to check-in to a room to use this service!"}
                    </div>
                  )}
                </div>

                {/* Notes Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {isVN ? "Ghi chú của khách hàng:" : "Customer notes:"}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isVN ? "Ví dụ: món nào dễ phai màu, vết bẩn cần tẩy kỹ..." : "E.g., which item easily fades, stubborn stains..."}
                    className="w-full text-sm rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-primary-500 focus:border-primary-500 py-2.5 px-3 h-20 text-neutral-700 dark:text-neutral-300"
                  />
                </div>

                {/* Total Price Section */}
                <div className="flex justify-between items-center py-2 border-t border-b border-dashed border-neutral-200 dark:border-neutral-700">
                  <span className="font-extrabold text-sm text-neutral-750 dark:text-neutral-300">{isVN ? "Tổng thanh toán (nợ phòng):" : "Total payment (room debt):"}</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-red-600 dark:text-red-400 block">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(finalTotal)}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      ({isVN ? "Đã nhân hệ số loại giặt x" : "Multiplied by laundry type factor x"}{multiplier})
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <ButtonPrimary
                  onClick={handleSubmitOrder}
                  loading={submitLoading}
                  disabled={submitLoading || !selectedBookingId}
                  className="w-full h-12 text-sm font-black shadow-lg"
                >
                  {isVN ? "⚡ Xác nhận yêu cầu giặt là" : "⚡ Confirm laundry request"}
                </ButtonPrimary>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
