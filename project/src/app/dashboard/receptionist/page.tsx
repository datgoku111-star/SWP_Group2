"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { CalendarCheck, Users, Search, CreditCard } from "lucide-react";

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    // Reusing the admin report endpoint since receptionists share some stats
    fetch("/api/admin/reports")
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);

    // Fetch all rooms for live monitoring and emergency status override
    fetch("/api/rooms?all=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRooms(data);
      })
      .catch(console.error);
  }, []);

  const handleOverrideStatus = async (roomId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus, status_updated_at: new Date().toISOString() } : r));
      } else {
        const err = await res.json();
        alert(`Failed to update room: ${err.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error updating room status");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Front Desk Operations</h1>
        <p className="text-neutral-500 mt-1">Hello, {user?.full_name}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Available Rooms</p>
              <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.available_rooms}</h4>
            </div>
            <div className="p-4 rounded-full bg-green-100 text-green-600"><CalendarCheck className="w-6 h-6" /></div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Today's Arrivals</p>
              <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.todays_arrivals}</h4>
            </div>
            <div className="p-4 rounded-full bg-blue-100 text-blue-600"><Users className="w-6 h-6" /></div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Today's Departures</p>
              <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.todays_departures}</h4>
            </div>
            <div className="p-4 rounded-full bg-amber-100 text-amber-600"><CreditCard className="w-6 h-6" /></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-6">Quick Tasks</h3>
          <div className="space-y-4">
            <Link href="/checkin" className="flex items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div className="p-3 bg-white dark:bg-neutral-700 rounded-lg shadow-sm mr-4 text-primary-6000"><Search className="w-5 h-5" /></div>
              <div>
                <h4 className="font-semibold">Check-in Guest</h4>
                <p className="text-sm text-neutral-500">Scan ID and assign room</p>
              </div>
            </Link>
            
            <Link href="/bookings" className="flex items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div className="p-3 bg-white dark:bg-neutral-700 rounded-lg shadow-sm mr-4 text-green-600"><CreditCard className="w-5 h-5" /></div>
              <div>
                <h4 className="font-semibold">Checkout & Invoice</h4>
                <p className="text-sm text-neutral-500">Process payments for departures</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Emergency Room Status Override Panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Room Status & Emergency Override</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Monitor live room conditions and manually override status for emergencies or immediate housekeeping needs.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Receptionist Override Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-base">Room {room.room_number}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    room.status === "AVAILABLE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                    room.status === "IN_USE" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                    room.status === "DIRTY" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                    room.status === "CLEANING" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
                    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {room.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  {room.room_type?.name || `Floor ${room.floor}`}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Override Status:</label>
                <select
                  value={room.status}
                  onChange={(e) => handleOverrideStatus(room.id, e.target.value)}
                  className="block w-full text-xs rounded-lg border-neutral-300 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-white py-1.5"
                >
                  <option value="AVAILABLE">AVAILABLE (Ready)</option>
                  <option value="IN_USE">IN_USE (Occupied)</option>
                  <option value="DIRTY">DIRTY (Needs clean)</option>
                  <option value="CLEANING">CLEANING (In progress)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Emergency)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
}
