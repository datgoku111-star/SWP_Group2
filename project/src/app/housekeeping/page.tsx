"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { Room, RoomStatus } from "@/types/hotel";
import DashboardLayout from "../dashboard/layout";

export default function HousekeepingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
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
      case "CLEANING": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "MAINTENANCE": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-12 mb-24 lg:mb-32 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white">
            Housekeeping & Emergency Status Grid
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Monitor room turnover and cleanliness across all floors. Receptionists can perform instant emergency overrides (`DIRTY` &rarr; `AVAILABLE` or `MAINTENANCE`) when expediting VIP arrivals.
          </p>
        </div>
      </div>
      
      <div className="space-y-12">
        {floors.map(floor => (
          <div key={floor} className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-neutral-200 dark:border-neutral-700 pb-2">
              Floor {floor}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {rooms.filter(r => r.floor === floor).map(room => (
                <div key={room.id} className={`p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between ${room.status === 'DIRTY' ? 'border-red-300 dark:border-red-700' : room.status === 'CLEANING' ? 'border-purple-300 dark:border-purple-700' : ''}`}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold">Room {room.room_number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                      {room.room_type?.name}
                    </div>

                    {room.status === "CLEANING" && (
                      <CleaningTimer startTime={room.status_updated_at || room.updated_at} />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {user?.role === "HOUSEKEEPING" ? (
                      <div>
                        {room.status === "DIRTY" ? (
                          <button
                            onClick={() => updateStatus(room.id, "CLEANING")}
                            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Start Cleaning</span>
                          </button>
                        ) : room.status === "CLEANING" ? (
                          <button
                            onClick={() => updateStatus(room.id, "AVAILABLE")}
                            className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Finish Cleaning</span>
                          </button>
                        ) : (
                          <div className="text-center py-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                            No cleaning action required
                          </div>
                        )}
                      </div>
                    ) : (
                      <select
                        value={room.status}
                        onChange={(e) => updateStatus(room.id, e.target.value as RoomStatus)}
                        className="block w-full text-sm rounded-lg border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="IN_USE">In Use</option>
                        <option value="DIRTY">Dirty</option>
                        <option value="CLEANING">Cleaning</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}

function CleaningTimer({ startTime }: { startTime?: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startTime) return;
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      if (hrs > 0) {
        setElapsed(`${hrs}h ${mins}m ${secs}s`);
      } else if (mins > 0) {
        setElapsed(`${mins}m ${secs}s`);
      } else {
        setElapsed(`${secs}s`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime || !elapsed) return null;
  return (
    <div className="p-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-lg flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
        <span>Cleaning Time:</span>
      </span>
      <span className="font-mono text-xs tracking-tight bg-white dark:bg-purple-900/50 px-1.5 py-0.5 rounded shadow-sm border border-purple-100 dark:border-purple-800">{elapsed}</span>
    </div>
  );
}
