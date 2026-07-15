"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { Room, RoomStatus } from "@/types/hotel";

interface CleaningTimerProps {
  statusUpdatedAt: string;
}

const CleaningTimer: React.FC<CleaningTimerProps> = ({ statusUpdatedAt }) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(statusUpdatedAt).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((now - start) / 1000));
    };

    setElapsed(calculateElapsed());

    const timer = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(timer);
  }, [statusUpdatedAt]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  return (
    <div className="flex items-center space-x-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900/50 animate-pulse">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Cleaning Time: {formatTime(elapsed)}</span>
    </div>
  );
};

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
        // Optimistic update including status_updated_at timestamp
        setRooms(rooms.map(r => r.id === roomId ? { 
          ...r, 
          status: newStatus,
          status_updated_at: new Date().toISOString()
        } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || loading) return <div className="container py-20 text-center font-medium">Loading...</div>;

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

  const isHousekeeping = user?.role === "HOUSEKEEPING";
  const isAdminOrReceptionist = user ? ["ADMIN", "RECEPTIONIST"].includes(user.role) : false;

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl text-neutral-900 dark:text-neutral-100">
            Housekeeping Management
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
            Monitor room cleaning status and perform maintenance workflow operations.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl w-fit shadow-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Role:</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 uppercase">
            {user?.role}
          </span>
        </div>
      </div>
      
      <div className="space-y-12">
        {floors.map(floor => (
          <div key={floor} className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-neutral-200 dark:border-neutral-700 pb-2 text-neutral-800 dark:text-neutral-200">
              Floor {floor}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {rooms.filter(r => r.floor === floor).map(room => (
                <div 
                  key={room.id} 
                  className={`p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[170px] ${
                    room.status === 'DIRTY' ? 'border-red-300 dark:border-red-800 bg-red-50/5 dark:bg-red-950/5' : 
                    room.status === 'CLEANING' ? 'border-purple-300 dark:border-purple-800 bg-purple-50/5 dark:bg-purple-950/5' : ''
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        Room {room.room_number}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(room.status)}`}>
                        {room.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                      {room.room_type?.name}
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    {/* Display Cleaning Timer for rooms currently in CLEANING state */}
                    {room.status === 'CLEANING' && room.status_updated_at && !isHousekeeping && (
                      <div className="mb-2">
                        <CleaningTimer statusUpdatedAt={room.status_updated_at} />
                      </div>
                    )}

                    {/* Controls based on role */}
                    {isHousekeeping && (
                      <div>
                        {room.status === 'DIRTY' ? (
                          <button
                            onClick={() => updateStatus(room.id, "CLEANING")}
                            className="w-full py-2 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center space-x-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Start Cleaning</span>
                          </button>
                        ) : room.status === 'CLEANING' ? (
                          <div className="space-y-3">
                            {room.status_updated_at && (
                              <CleaningTimer statusUpdatedAt={room.status_updated_at} />
                            )}
                            <button
                              onClick={() => updateStatus(room.id, "AVAILABLE")}
                              className="w-full py-2 px-3 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center space-x-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Finish Cleaning</span>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full py-2 text-center text-xs font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800">
                            No action required
                          </div>
                        )}
                      </div>
                    )}

                    {isAdminOrReceptionist && (
                      <select
                        value={room.status}
                        onChange={(e) => updateStatus(room.id, e.target.value as RoomStatus)}
                        className="block w-full text-sm rounded-lg border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900 py-1.5 px-3"
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
  );
}
