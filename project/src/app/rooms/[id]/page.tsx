import React from "react";
import { getRoomById } from "@/lib/db/rooms";
import { notFound } from "next/navigation";
import Image from "next/image";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { CheckIcon } from "lucide-react";
import CurrencyPrice from "@/components/CurrencyPrice";

export default async function RoomDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const room = await getRoomById(params.id).catch(() => null);

  if (!room || !room.room_type) {
    notFound();
  }

  const rt = room.room_type;

  return (
    <div className="container py-16 mb-24 lg:mb-32 space-y-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold sm:text-4xl">
          {rt.name} Room - {room.room_number}
        </h2>

        <div className="flex items-center text-neutral-500 dark:text-neutral-400 space-x-4">
          <span>Floor {room.floor}</span>
          <span>•</span>
          <span>Max {rt.max_occupancy} Guests</span>
          <span>•</span>
          <span
            className={
              room.status === "AVAILABLE" ? "text-green-600" : "text-amber-600"
            }
          >
            {room.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src={rt.images[0] || "/images/placeholder.png"}
            alt={rt.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {rt.images.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden"
            >
              <Image src={img} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-grow space-y-8">
          <div>
            <h3 className="text-2xl font-semibold">About this room</h3>

            <div className="w-14 border-b border-neutral-200 dark:border-neutral-700 my-4"></div>

            <p className="text-neutral-600 dark:text-neutral-300">
              {rt.description || "No description available."}
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Amenities</h3>

            <div className="w-14 border-b border-neutral-200 dark:border-neutral-700 my-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rt.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckIcon className="w-5 h-5 text-primary-6000" />
                  <span className="text-neutral-600 dark:text-neutral-300">
                    {amenity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 flex-shrink-0">
          <div className="sticky top-28 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl">
            <div className="text-2xl font-semibold mb-6 flex items-end">
              <CurrencyPrice amount={rt.base_price} />
              <span className="text-sm font-normal text-neutral-500 ml-1">
                /night
              </span>
            </div>

            <form action={`/book/${room.id}`} method="GET" className="space-y-4">
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-sm">
                  Check-in
                </span>

                <input
                  type="date"
                  name="checkIn"
                  required
                  className="block w-full h-11 px-4 py-3 mt-1 text-sm font-normal rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                />
              </label>

              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-sm">
                  Check-out
                </span>

                <input
                  type="date"
                  name="checkOut"
                  required
                  className="block w-full h-11 px-4 py-3 mt-1 text-sm font-normal rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                />
              </label>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                {room.status === "AVAILABLE" ? (
                  <ButtonPrimary type="submit" className="w-full h-12">
                    Book Now
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary disabled className="w-full h-12 bg-neutral-400">
                    Room Unavailable
                  </ButtonPrimary>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}