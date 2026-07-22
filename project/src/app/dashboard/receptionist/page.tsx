"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CalendarCheck, 
  Users, 
  Search, 
  CreditCard, 
  RefreshCw, 
  Home, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Phone, 
  User, 
  Calendar, 
  Sparkles,
  BedDouble,
  ShieldCheck,
  Clock
} from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import type { Room, Booking, RoomType } from "@/types/hotel";

export default function ReceptionistDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  // Room Availability Query State ("TRUY VẤN KIỂM TRA PHÒNG TRỐNG")
  const [checkInDate, setCheckInDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<Room[] | null>(null);
  const [searchingRooms, setSearchingRooms] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role))) {
      router.push("/dashboard");
    } else if (user) {
      fetchDashboardData();
      fetchRoomTypes();
      fetchRoomsForOverride();
    }
  }, [user, isLoading, router]);

  const fetchRoomsForOverride = () => {
    fetch("/api/rooms?all=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRooms(data);
      })
      .catch(console.error);
  };

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/receptionist/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch receptionist dashboard:", error);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch("/api/rooms?all=true");
      if (res.ok) {
        const roomsData: Room[] = await res.json();
        const typesMap = new Map<string, RoomType>();
        roomsData.forEach((r) => {
          if (r.room_type) {
            typesMap.set(r.room_type.id, r.room_type);
          }
        });
        setRoomTypes(Array.from(typesMap.values()));
      }
    } catch (err) {
      console.error("Error loading room types:", err);
    }
  };

  const handleSearchAvailableRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchingRooms(true);
    setSearchError("");
    setAvailableRooms(null);

    if (checkInDate >= checkOutDate) {
      setSearchError("Check-out date must be strictly after Check-in date.");
      setSearchingRooms(false);
      return;
    }

    try {
      let url = `/api/rooms?checkIn=${checkInDate}&checkOut=${checkOutDate}`;
      if (selectedTypeId) {
        url += `&type=${selectedTypeId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to query available rooms");
      const data = await res.json();
      setAvailableRooms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setSearchError(err.message || "Error checking room availability");
    } finally {
      setSearchingRooms(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="container py-20 text-center">
        <div className="w-8 h-8 border-4 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500 font-medium">Loading Front Desk Operations Console...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const arrivals: Booking[] = dashboardData?.arrivals || [];
  const departures: Booking[] = dashboardData?.departures || [];
  const roomsSummary = dashboardData?.roomsSummary || { AVAILABLE: 0, IN_USE: 0, DIRTY: 0, MAINTENANCE: 0, total: 0 };
  const checkoutRequests = dashboardData?.checkoutRequests || [];

  const handleSendCleaner = async (bookingId: string) => {
    try {
      const res = await fetch("/api/receptionist/checkout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "SEND_CLEANER", message: "Lễ tân đã nhận yêu cầu. Nhân viên đang lên kiểm tra phòng..." }),
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error sending cleaner");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

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
    <div className="container py-10 mb-24 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-6000 dark:text-primary-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Front Desk Management Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
            Receptionist Console
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Welcome back, <span className="font-semibold text-neutral-800 dark:text-neutral-200">{user?.full_name}</span>. Oversee check-ins, departures, live room availability, and guest billing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary-6000" : ""}`} />
            <span>Refresh Live Data</span>
          </button>
          <Link
            href="/checkin"
            className="px-5 py-2.5 rounded-xl bg-primary-6000 hover:bg-primary-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-primary-6000/25 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Check-In / Check-Out Desk</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Available Rooms</span>
            <div className="p-2.5 rounded-2xl bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            {roomsSummary.AVAILABLE} <span className="text-sm font-normal text-neutral-400">/ {roomsSummary.total}</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for immediate check-in
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Today's Arrivals</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            {arrivals.length}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2 flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" /> Confirmed expected arrivals
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Today's Departures</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            {departures.length}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Currently checked in
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Housekeeping Status</span>
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{roomsSummary.DIRTY}</span>
              <span className="text-[11px] text-neutral-500 block">Dirty</span>
            </div>
            <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{roomsSummary.IN_USE}</span>
              <span className="text-[11px] text-neutral-500 block">In Use</span>
            </div>
            <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{roomsSummary.MAINTENANCE}</span>
              <span className="text-[11px] text-neutral-500 block">Maint.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Checkout Requests */}
      {checkoutRequests && checkoutRequests.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-amber-400 dark:border-amber-600 rounded-3xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-extrabold text-amber-900 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Pending Check-Out Requests</span>
            </h3>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs font-bold animate-pulse">
              {checkoutRequests.length} Request(s)
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {checkoutRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white">Room {req.room?.room_number}</span>
                    <span className="text-xs text-neutral-500 ml-2 block sm:inline">{req.user?.full_name || req.guest?.full_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.checkout_step === "REQUESTED" ? "bg-amber-200 text-amber-900" :
                    req.checkout_step === "INSPECTING" ? "bg-blue-200 text-blue-900" :
                    "bg-green-200 text-green-900"
                  }`}>
                    {req.checkout_step}
                  </span>
                </div>
                
                <div className="text-xs text-neutral-500">
                  Requested at: {new Date(req.checkout_requested_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  {req.checkout_step === "REQUESTED" && (
                    <ButtonPrimary
                      sizeClass="py-2 px-3"
                      className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 shadow-sm"
                      onClick={() => handleSendCleaner(req.id)}
                    >
                      Báo nhân viên kiểm tra
                    </ButtonPrimary>
                  )}
                  {req.checkout_step === "INSPECTING" && (
                    <button disabled className="w-full py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 rounded-xl text-xs font-bold">
                      Đang đợi kiểm tra...
                    </button>
                  )}
                  {req.checkout_step === "INSPECTED" && (
                    <Link
                      href={`/checkin?bookingId=${req.id}&mode=checkout`}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold text-center block"
                    >
                      Tiến hành Checkout
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRUY VẤN KIỂM TRA PHÒNG TRỐNG (Room Availability Search Module) */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-neutral-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-6000/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="max-w-3xl mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-400 mb-1">
            <Search className="w-4 h-4" />
            <span>Room Availability Query Console (Truy Vấn Kiểm Tra Phòng Trống)</span>
          </div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Search & Check Live Room Vacancy</h2>
          <p className="text-neutral-300 text-sm mt-1">
            Verify real-time vacancy by date ranges and room classes for walk-in guests or phone inquiries.
          </p>
        </div>

        {searchError && (
          <div className="p-4 mb-6 bg-red-950/80 border border-red-700 text-red-200 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{searchError}</span>
          </div>
        )}

        <form onSubmit={handleSearchAvailableRooms} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-neutral-800/80 p-5 rounded-2xl border border-neutral-700/60 backdrop-blur-md">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Check-in Date
            </label>
            <Input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Check-out Date
            </label>
            <Input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Room Class / Type
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="block w-full text-sm rounded-2xl border-neutral-700 focus:border-primary-500 focus:ring focus:ring-primary-500/30 bg-neutral-900 text-white h-11 px-3 font-medium"
            >
              <option value="">All Room Classes</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({formatCurrency(t.base_price || (t as any).base_price_per_night || 0)}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <ButtonPrimary
              type="submit"
              disabled={searchingRooms}
              className="w-full h-11 text-sm font-bold shadow-lg shadow-primary-6000/25 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{searchingRooms ? "Checking..." : "Check Availability"}</span>
            </ButtonPrimary>
          </div>
        </form>

        {/* Results of Availability Check */}
        {availableRooms !== null && (
          <div className="mt-6 pt-6 border-t border-neutral-700/80">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Found {availableRooms.length} Vacant Room(s) for ({checkInDate} &rarr; {checkOutDate})</span>
              </h4>
              <button
                type="button"
                onClick={() => setAvailableRooms(null)}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Clear Results
              </button>
            </div>

            {availableRooms.length === 0 ? (
              <div className="p-6 bg-neutral-800/50 rounded-2xl border border-dashed border-neutral-700 text-center text-neutral-400 text-sm">
                No rooms are currently vacant matching your selected dates and room class. Try modifying the date range or selecting "All Room Classes".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-1">
                {availableRooms.map((room) => (
                  <div key={room.id} className="p-4 rounded-2xl bg-neutral-800/90 border border-neutral-700/80 hover:border-primary-500/80 transition-all flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-white">Room {room.room_number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-950 text-green-300 border border-green-700">
                          {room.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-primary-300 mt-0.5">
                        {room.room_type?.name}
                      </div>
                      <div className="text-xs text-neutral-300 mt-2 flex items-center justify-between">
                        <span>Floor {room.floor} &bull; {room.room_type?.max_occupancy || (room.room_type as any)?.max_guests || 2} Guests</span>
                        <span className="font-bold text-white">{formatCurrency(room.room_type?.base_price || (room.room_type as any)?.base_price_per_night || 0)} / night</span>
                      </div>
                    </div>

                    <Link
                      href={`/checkin?roomId=${room.id}&checkIn=${checkInDate}&checkOut=${checkOutDate}`}
                      className="w-full py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-xl text-xs font-bold text-center block transition-colors shadow-sm"
                    >
                      ⚡ Instant Walk-In Check-In
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Arrivals & Departures Split Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Arrivals Column */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Today's Arriving Guests</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Confirmed bookings ready for check-in</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold">
              {arrivals.length} Expected
            </span>
          </div>

          <div className="space-y-3 flex-grow overflow-y-auto max-h-[420px] pr-1">
            {arrivals.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                No confirmed arriving bookings for today.
              </div>
            ) : (
              arrivals.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        Room {b.room?.room_number} ({b.room?.room_type?.name})
                      </span>
                    </div>
                    <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mt-1 truncate">
                      <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span>{b.user?.full_name || b.guest?.full_name || "Guest"}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-3 mt-1">
                      <span>Nights: {b.check_in_date} &rarr; {b.check_out_date}</span>
                    </div>
                  </div>

                  <Link
                    href={`/checkin?bookingId=${b.id}`}
                    className="flex-shrink-0 px-3.5 py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>Check-In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Departures Column */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Today's Departing Guests</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Checked-in rooms scheduled for check-out</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold">
              {departures.length} Departures
            </span>
          </div>

          <div className="space-y-3 flex-grow overflow-y-auto max-h-[420px] pr-1">
            {departures.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                No currently checked-in rooms scheduled for check-out today.
              </div>
            ) : (
              departures.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        Room {b.room?.room_number} ({b.room?.room_type?.name})
                      </span>
                    </div>
                    <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mt-1 truncate">
                      <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span>{b.user?.full_name || b.guest?.full_name || "Guest"}</span>
                    </div>
                    <div className="text-xs font-bold text-primary-6000 dark:text-primary-400 mt-1">
                      Balance: {formatCurrency(b.total_amount)}
                    </div>
                  </div>

                  <Link
                    href={`/checkin?bookingId=${b.id}&mode=checkout`}
                    className="flex-shrink-0 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>Check-Out</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <Link
          href="/checkin"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-500 transition-all flex items-center gap-4 group"
        >
          <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-6000 dark:text-primary-400 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">Check-In / Check-Out Desk</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Verify ID (AI OCR), assign rooms & settle payment</p>
          </div>
        </Link>

        <Link
          href="/bookings"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-500 transition-all flex items-center gap-4 group"
        >
          <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">All Bookings & Invoices</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Filter all reservations, print invoices & search records</p>
          </div>
        </Link>

        <Link
          href="/housekeeping"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-500 transition-all flex items-center gap-4 group"
        >
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">Housekeeping Grid & Override</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Monitor room cleanliness & perform emergency turnover</p>
          </div>
        </Link>
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
