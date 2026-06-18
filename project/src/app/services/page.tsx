"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import Image from "next/image";
import ButtonPrimary from "@/shared/ButtonPrimary";
import type { Service, Booking } from "@/types/hotel";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";

export default function ServicesPage() {
  const { user, isLoading } = useAuth();
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
      // For simplicity, we just fetch all user's bookings and filter client-side for now
      // In a real app, you'd want a specific endpoint like /api/bookings/active
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        // Assume user is a customer looking at their own bookings
        // Or if staff, they might need a way to search for a guest's booking.
        // For this UI, we'll focus on the Customer experience (UC06)
        const myBookings = data.filter((b: Booking) => b.user_id === user?.id && b.status === "CHECKED_IN");
        setBookings(myBookings);
        if (myBookings.length > 0) {
          setSelectedBookingId(myBookings[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  const addToCart = (serviceId: string) => {
    setCart(prev => ({ ...prev, [serviceId]: (prev[serviceId] || 0) + 1 }));
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[serviceId] > 1) {
        newCart[serviceId]--;
      } else {
        delete newCart[serviceId];
      }
      return newCart;
    });
  };

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const service = services.find(s => s.id === id);
    return total + (service ? service.price * qty : 0);
  }, 0);

  const placeOrder = async () => {
    if (!selectedBookingId) {
      setError("Please select an active booking room first.");
      return;
    }
    
    setOrderLoading(true);
    setError("");
    
    const items = Object.entries(cart).map(([service_id, quantity]) => ({ service_id, quantity }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: selectedBookingId, items })
      });

      if (!res.ok) throw new Error("Failed to place order");
      
      setSuccess("Order placed successfully! Staff will attend to it shortly.");
      setCart({});
      setIsCartOpen(false);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (isLoading) return <div className="container py-20">Loading...</div>;

  const filteredServices = activeCategory === "ALL" 
    ? services 
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="container py-16 mb-24 lg:mb-32 relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">Hotel Services</h2>
          <p className="text-neutral-500 mt-2">Order food, drinks, laundry, and more directly to your room.</p>
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

      {success && <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-xl">{success}</div>}

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors ${
            activeCategory === "ALL" ? "bg-primary-6000 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          }`}
        >
          All Services
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeCategory === cat ? "bg-primary-6000 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map(service => (
          <div key={service.id} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:shadow-xl transition-shadow flex flex-col h-full">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-500">{service.category}</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
                {service.description || "No description"}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold text-primary-6000">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(service.price)}
              </span>
              
              {cart[service.id] ? (
                <div className="flex items-center space-x-3 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                  <button onClick={() => removeFromCart(service.id)} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shadow-sm">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{cart[service.id]}</span>
                  <button onClick={() => addToCart(service.id)} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shadow-sm">
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute top-0 right-0 max-w-md w-full h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col transform transition-transform">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Your Order</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
              {cartItemsCount === 0 ? (
                <div className="text-center text-neutral-500 py-10">Your cart is empty.</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(cart).map(([id, qty]) => {
                    const service = services.find(s => s.id === id);
                    if (!service) return null;
                    return (
                      <div key={id} className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <span className="text-sm text-neutral-500">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(service.price)} x {qty}
                          </span>
                        </div>
                        <span className="font-semibold">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(service.price * qty)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItemsCount > 0 && (
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Deliver to Room</label>
                  <select 
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="block w-full text-sm rounded-xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                  >
                    <option value="" disabled>Select your active room</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>Room {b.room?.room_number}</option>
                    ))}
                  </select>
                </div>
                
                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                
                <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary-6000">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cartTotal)}
                  </span>
                </div>
                
                <ButtonPrimary onClick={placeOrder} loading={orderLoading} disabled={orderLoading || !selectedBookingId} className="w-full h-12">
                  Place Order
                </ButtonPrimary>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
