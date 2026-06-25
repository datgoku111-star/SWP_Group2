import React from "react";
import { getRoomsWithDeadlines, getRoomTypes } from "@/lib/db/rooms";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Image from "next/image";
import Link from "next/link";
import { Route } from "@/routers/types";
import { Room } from "@/types/hotel";

export const revalidate = 0; // Disable static rendering

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: { checkIn?: string; checkOut?: string; type?: string };
}) {
  const [rooms, roomTypes] = await Promise.all([
    getRoomsWithDeadlines(
      searchParams.checkIn,
      searchParams.checkOut,
      searchParams.type
    ),
    getRoomTypes(),
  ]);

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <div className="space-y-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">Available Rooms</h2>
          <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
            Select dates and find the perfect room for your stay.
          </span>
        </div>

        {/* Filter Bar (Simplified since we use server components) */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <form className="flex flex-wrap gap-4 items-end w-full" action="/rooms" method="GET">
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200 text-sm">Check-in</span>
              <input
                type="date"
                name="checkIn"
                defaultValue={searchParams.checkIn}
                className="block w-full h-11 px-4 py-3 mt-1 text-sm font-normal rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
              />
            </label>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200 text-sm">Check-out</span>
              <input
                type="date"
                name="checkOut"
                defaultValue={searchParams.checkOut}
                className="block w-full h-11 px-4 py-3 mt-1 text-sm font-normal rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
              />
            </label>
            <label className="block flex-grow min-w-[200px]">
              <span className="text-neutral-800 dark:text-neutral-200 text-sm">Room Type</span>
              <select
                name="type"
                defaultValue={searchParams.type || ""}
                className="block w-full h-11 px-4 py-3 mt-1 text-sm font-normal rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
              >
                <option value="">All Types</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <ButtonPrimary type="submit" className="h-11">
              Search
            </ButtonPrimary>
          </form>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
          {rooms.length === 0 && (
            <div className="col-span-full py-10 text-center text-neutral-500">
              No rooms available matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline component for the room card, reusing Chisfis styles where possible
function RoomCard({ room }: { room: Room }) {
  const rt = room.room_type;
  if (!rt) return null;

  return (
    <div className="nc-StayCard group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow will-change-transform">
      <Link href={`/rooms/${room.id}` as Route} className="block absolute inset-0"></Link>
      
      <div className="relative w-full aspect-w-4 aspect-h-3 overflow-hidden">
        <Image
          src={rt.images[0] || "/images/placeholder.png"}
          alt={rt.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute left-3 top-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs font-semibold backdrop-blur-sm">
          Room {room.room_number}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {rt.name} • Floor {room.floor}
          </span>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white line-clamp-1">
            {rt.name} Room - {room.room_number}
          </h2>
        </div>

        <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm space-x-2">
          <span>Max: {rt.max_occupancy} Guests</span>
          {(room as any).deadline && (
            <>
              <span>•</span>
              <span className="text-red-500 font-medium whitespace-nowrap">
                Trống từ: {(room as any).deadline}
              </span>
            </>
          )}
        </div>

        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-primary-6000">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rt.base_price)}
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
              /night
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
