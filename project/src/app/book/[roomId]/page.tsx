"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import type { Room } from "@/types/hotel";

export default function BookingPage({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { user, isLoading } = useAuth();

  const checkIn = searchParamsHook?.get("checkIn") || "";
  const checkOut = searchParamsHook?.get("checkOut") || "";
  
  const [room, setRoom] = useState<Room | null>(null);
  const [guests, setGuests] = useState(1);
  const [requests, setRequests] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push(`/hsrm-login?callbackUrl=/book/${params.roomId}?checkIn=${checkIn}&checkOut=${checkOut}` as Route);
    }
  }, [user, isLoading, router, params.roomId, checkIn, checkOut]);

  useEffect(() => {
    fetch(`/api/rooms/${params.roomId}`)
      .then((res) => res.json())
      .then((data) => setRoom(data))
      .catch((err) => console.error(err));
  }, [params.roomId]);

  if (isLoading || !user || !room || !room.room_type) {
    return <div className="container py-20 text-center">Loading...</div>;
  }

  // Calculate days and total
  const ciDate = new Date(checkIn);
  const coDate = new Date(checkOut);
  let days = 1;
  if (!isNaN(ciDate.getTime()) && !isNaN(coDate.getTime())) {
    const diffTime = Math.abs(coDate.getTime() - ciDate.getTime());
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const totalAmount = days * room.room_type.base_price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          num_guests: guests,
          total_amount: totalAmount,
          special_requests: requests,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to book room");
      }

      router.push("/dashboard/customer" as Route);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <h2 className="text-3xl font-semibold sm:text-4xl mb-10">Confirm Booking</h2>
      
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-grow space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">Full Name</span>
                <Input defaultValue={user.full_name} disabled className="mt-1 bg-neutral-100 dark:bg-neutral-800" />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">Email</span>
                <Input defaultValue={user.email} disabled className="mt-1 bg-neutral-100 dark:bg-neutral-800" />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">Check-in Date</span>
                <Input defaultValue={checkIn} disabled className="mt-1 bg-neutral-100 dark:bg-neutral-800" />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">Check-out Date</span>
                <Input defaultValue={checkOut} disabled className="mt-1 bg-neutral-100 dark:bg-neutral-800" />
              </label>
            </div>

            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">Number of Guests</span>
              <Input
                type="number"
                min="1"
                max={room.room_type.max_occupancy}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="mt-1"
                required
              />
            </label>

            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">Special Requests</span>
              <textarea
                className="block w-full text-sm rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900 mt-1"
                rows={4}
                value={requests}
                onChange={(e) => setRequests(e.target.value)}
              ></textarea>
            </label>

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <ButtonPrimary type="submit" loading={loading} disabled={loading} className="w-full h-12">
              Confirm Booking
            </ButtonPrimary>
          </form>
        </div>

        {/* Summary sidebar */}
        <div className="lg:w-1/3 flex-shrink-0">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Price details</h3>
            <div className="space-y-4 text-neutral-600 dark:text-neutral-300">
              <div className="flex justify-between">
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.room_type.base_price)} x {days} nights</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount)}</span>
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 flex justify-between font-semibold text-lg text-neutral-900 dark:text-white">
                <span>Total</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
