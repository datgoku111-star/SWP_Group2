"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { Room, RoomStatus } from "@/types/hotel";

export default function HousekeepingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !["ADMIN", "HOUSEKEEPING"].includes(user.role)) {
        router.push("/dashboard");
      } else {
        fetchRooms();
      }
    }
  }, [user, isLoading, router]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms?all=true");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (roomId: string, newStatus: RoomStatus) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Optimistic update
        setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || loading) return <div className="container py-20">Loading...</div>;

  // Group by floor
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);

  const getStatusColor = (status: RoomStatus) => {
    switch(status) {
      case "AVAILABLE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "IN_USE": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "DIRTY": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "MAINTENANCE": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <h2 className="text-3xl font-semibold sm:text-4xl mb-10">Housekeeping Dashboard</h2>
      
      <div className="space-y-12">
        {floors.map(floor => (
          <div key={floor} className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-neutral-200 dark:border-neutral-700 pb-2">
              Floor {floor}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {rooms.filter(r => r.floor === floor).map(room => (
                <div key={room.id} className={`p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm ${room.status === 'DIRTY' ? 'border-red-300 dark:border-red-700' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-bold">Room {room.room_number}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {room.room_type?.name}
                  </div>
                  <select
                    value={room.status}
                    onChange={(e) => updateStatus(room.id, e.target.value as RoomStatus)}
                    className="block w-full text-sm rounded-lg border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use</option>
                    <option value="DIRTY">Dirty</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
