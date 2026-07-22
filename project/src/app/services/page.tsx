"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import Image from "next/image";
import ButtonPrimary from "@/shared/ButtonPrimary";
import type { Service, Booking } from "@/types/hotel";
import { ShoppingCart, Plus, Minus, X, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

export default function ServicesPage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");

  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/services" as Route);
      return;
    }

    if (user) {
      fetchServices();
      fetchActiveBookings();
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && categories.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) {
        const found = categories.find((c) => c.toUpperCase() === cat.toUpperCase());
        if (found) {
          setActiveCategory(found);
        }
      }
    }
  }, [categories]);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        const cats = Array.from(new Set(data.map((s: Service) => s.category)));
        setCategories(cats as string[]);
      }
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      // Fetch all bookings and filter based on roles and active status
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        
        let activeBookings = [];
        if (user?.role === "CUSTOMER") {
          activeBookings = data.filter(
            (b: Booking) => b.user_id === user?.id && b.status === "CHECKED_IN"
          );
        } else {
          // Admin, receptionists can select from all checked-in bookings
          activeBookings = data.filter(
            (b: Booking) => b.status === "CHECKED_IN"
          );
        }

        setBookings(activeBookings);
        if (activeBookings.length > 0) {
          setSelectedBookingId(activeBookings[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
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

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const service = services.find((s) => s.id === id);
    return total + (service ? service.price * qty : 0);
  }, 0);

  const placeOrderDirect = async () => {
    if (!selectedBookingId) {
      setError(t("servicesSelectRoomError"));
      return;
    }
    setOrderLoading(true);
    setError("");
    try {
      const cartEntries = Object.entries(cart);
      if (cartEntries.length === 0) return;
      const items = cartEntries.map(([service_id, quantity]) => ({ service_id, quantity }));
      const selectedB = bookings.find((b) => b.id === selectedBookingId);
      const roomNum = selectedB?.room?.room_number || "P-VIP";

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBookingId,
          total_amount: cartTotal,
          items,
          notes: `Khách đặt từ phòng ${roomNum}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Không thể gửi yêu cầu đặt món");
      }

      setCart({});
      setIsCartOpen(false);
      
      if (user?.role === "CUSTOMER") {
        router.push("/dashboard/customer" as Route);
      } else {
        setSuccess("✅ Đã gửi đơn đặt món thành công! Đơn hàng đã gửi tới Lễ Tân để duyệt & chuyển xuống Bếp.");
        setTimeout(() => setSuccess(""), 6000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setOrderLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedBookingId) {
      setError(t("servicesSelectRoomError"));
      return;
    }
    
    // Determine title, category, and image dynamically based on cart items
    const cartEntries = Object.entries(cart);
    let title = "Service Order";
    let category = "Hotel Service";
    let img = "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500"; // neutral service img
    
    if (cartEntries.length > 0) {
      const firstServiceId = cartEntries[0][0];
      const firstService = services.find((s) => s.id === firstServiceId);
      if (firstService) {
        if (firstService.category.toUpperCase() === "LAUNDRY") {
          title = "Laundry Order";
          category = "Laundry Service";
          img = "https://images.unsplash.com/photo-1545173168-9f1947eebd01?w=500"; // laundry service img
        } else if (firstService.category.toUpperCase() === "FOOD") {
          title = "Food Order";
          category = "Food Service";
          img = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500";
        } else if (firstService.category.toUpperCase() === "BEVERAGE") {
          title = "Beverage Order";
          category = "Beverage Service";
          img = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500";
        }
      }
    }

    // Gom các sản phẩm trong giỏ hàng lại
    const items = cartEntries.map(([service_id, quantity]) => ({ service_id, quantity }));
    const itemsParam = encodeURIComponent(JSON.stringify(items));
    // Chuyển hướng tới trang checkout kèm tham số hóa đơn
    router.push(
      `/checkout?type=service&bookingId=${selectedBookingId}&items=${itemsParam}&price=${cartTotal}&title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}&img=${encodeURIComponent(img)}` as Route
    );
  };

  if (isLoading) return <div className="container py-20">{t("loading")}</div>;
  const filteredServices =
    activeCategory === "ALL"
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <div className="container py-16 mb-24 lg:mb-32 relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            {t("servicesTitle")}
          </h2>
          <p className="text-neutral-500 mt-2">{t("servicesDesc")}</p>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-3 bg-primary-50 text-primary-6000 rounded-full hover:bg-primary-100 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {success && (
        <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-xl">
          {success}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors ${
            activeCategory === "ALL"
              ? "bg-primary-6000 text-white"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          }`}
        >
          {t("allServices")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary-6000 text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:shadow-xl transition-shadow flex flex-col h-full"
          >
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-500">
                  {service.category}
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
                {service.description || t("noDescription")}
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold text-primary-6000">
                {new Intl.NumberFormat(
                  i18n.language === "vn" ? "vi-VN" : "en-US",
                  { style: "currency", currency: "VND" },
                ).format(service.price)}
              </span>

              {cart[service.id] ? (
                <div className="flex items-center space-x-3 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                  <button
                    onClick={() => removeFromCart(service.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shadow-sm"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">
                    {cart[service.id]}
                  </span>
                  <button
                    onClick={() => addToCart(service.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(service.id)}
                  className="w-8 h-8 rounded-full bg-primary-50 text-primary-6000 flex items-center justify-center hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="absolute top-0 right-0 max-w-md w-full h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col transform transition-transform">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h3 className="text-2xl font-semibold">
                {t("servicesYourOrder")}
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
              {cartItemsCount === 0 ? (
                <div className="text-center text-neutral-500 py-10">
                  {t("servicesCartEmpty")}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(cart).map(([id, qty]) => {
                    const service = services.find((s) => s.id === id);
                    if (!service) return null;
                    return (
                      <div
                        key={id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <span className="text-sm text-neutral-500">
                            {new Intl.NumberFormat(
                              i18n.language === "vn" ? "vi-VN" : "en-US",
                              { style: "currency", currency: "VND" },
                            ).format(service.price)}{" "}
                            x {qty}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold">
                            {new Intl.NumberFormat(
                              i18n.language === "vn" ? "vi-VN" : "en-US",
                              { style: "currency", currency: "VND" },
                            ).format(service.price * qty)}
                          </span>
                          <button
                            onClick={() => clearItemFromCart(id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItemsCount > 0 && (
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {t("servicesDeliverToRoom")}
                  </label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="block w-full text-sm rounded-xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                  >
                    <option value="" disabled>
                      {t("servicesSelectRoom")}
                    </option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {t("roomLabel")} {b.room?.room_number}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="text-red-500 text-sm mb-4">{error}</div>
                )}

                <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                  <span>Total</span>

                  <span className="text-primary-6000">
                    {new Intl.NumberFormat(
                      i18n.language === "vn" ? "vi-VN" : "en-US",
                      { style: "currency", currency: "VND" },
                    ).format(cartTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  <ButtonPrimary
                    onClick={placeOrderDirect}
                    loading={orderLoading}
                    disabled={orderLoading || !selectedBookingId}
                    className="w-full h-12 text-sm font-extrabold shadow-lg"
                  >
                    ⚡ Đặt Món & Chuyển Lên Lễ Tân (Ghi Nợ Phòng)
                  </ButtonPrimary>
                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={orderLoading || !selectedBookingId}
                    className="w-full py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    💳 Hoặc Thanh Toán VietQR / PayOS Trực Tuyến
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
