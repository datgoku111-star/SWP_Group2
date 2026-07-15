"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import type { Booking, Room } from "@/types/hotel";
import ReceptionistServiceHub from "@/components/ReceptionistServiceHub";
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  Home, 
  FileText, 
  Phone, 
  RefreshCw, 
  CreditCard, 
  LogOut, 
  LogIn, 
  PlusCircle, 
  BedDouble,
  DollarSign,
  Utensils
} from "lucide-react";

function CheckInContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlBookingId = searchParams?.get("bookingId");
  const urlMode = searchParams?.get("mode");
  const urlRoomId = searchParams?.get("roomId");
  const urlCheckIn = searchParams?.get("checkIn");
  const urlCheckOut = searchParams?.get("checkOut");

  // Modes: 'checkin' | 'checkout' | 'walkin' | 'services'
  const [activeTab, setActiveTab] = useState<"checkin" | "checkout" | "walkin" | "services">(
    urlMode === "checkout" ? "checkout" : urlMode === "services" ? "services" : urlRoomId ? "walkin" : "checkin"
  );

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);

  // Walk-in State
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [walkInDates, setWalkInDates] = useState({
    check_in: urlCheckIn || new Date().toISOString().split("T")[0],
    check_out: urlCheckOut || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })(),
    num_guests: 1,
  });

  const [guestForm, setGuestForm] = useState({
    full_name: "",
    id_card_number: "",
    id_card_type: "CCCD",
    nationality: "Vietnam",
    address: "",
  });

  // Check-Out Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH" | "BANK_TRANSFER">("CARD");
  const [transactionRef, setTransactionRef] = useState("");
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  // Action Loading & Messages
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role))) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && ["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      if (activeTab === "walkin") {
        fetchAvailableRoomsForWalkIn();
      } else {
        handleSearchQuery("", activeTab === "checkout" ? "CHECKED_IN" : "CONFIRMED");
      }
    }
  }, [user, activeTab]);

  // Handle auto-selection if bookingId or roomId is passed in URL
  useEffect(() => {
    if (urlBookingId && searchResults.length > 0) {
      const found = searchResults.find((b) => b.id === urlBookingId);
      if (found) {
        handleSelectBooking(found);
      }
    }
  }, [urlBookingId, searchResults]);

  useEffect(() => {
    if (urlRoomId && availableRooms.length > 0) {
      const found = availableRooms.find((r) => r.id === urlRoomId);
      if (found) {
        setSelectedRoom(found);
      }
    }
  }, [urlRoomId, availableRooms]);

  const fetchAvailableRoomsForWalkIn = async () => {
    try {
      const res = await fetch(`/api/rooms?checkIn=${walkInDates.check_in}&checkOut=${walkInDates.check_out}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableRooms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching rooms for walkin:", err);
    }
  };

  const handleSearchQuery = async (query: string, statusFilter?: string) => {
    setIsSearching(true);
    setError("");
    try {
      let url = `/api/bookings/search?query=${encodeURIComponent(query.trim())}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      } else if (activeTab === "checkout") {
        url += `&status=CHECKED_IN`;
      } else if (activeTab === "checkin") {
        url += `&status=CONFIRMED`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search bookings");
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchQuery(searchKeyword);
  };

  const handleSelectBooking = (selected: any) => {
    setError("");
    setSuccess("");
    if (["CANCELLED", "CHECKED_OUT"].includes(selected.status)) {
      setError(`Cannot process: Selected booking is currently ${selected.status}.`);
      return;
    }
    setBooking(selected);

    // Switch tab automatically based on status if needed
    if (selected.status === "CHECKED_IN") {
      setActiveTab("checkout");
      setCustomAmount(selected.total_amount || 0);
      setTransactionRef("TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase());
    } else if (selected.status === "CONFIRMED" || selected.status === "PENDING") {
      setActiveTab("checkin");
      const defaultName = selected.user?.full_name || selected.guest?.full_name || "";
      if (defaultName && !guestForm.full_name) {
        setGuestForm((prev) => ({ ...prev, full_name: defaultName }));
      }
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

  // Action 1: Confirm Check-In
  const confirmCheckIn = async () => {
    if (!booking) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          guest: guestForm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Check-in failed");
      }

      setSuccess(`✅ Check-in successful! Room ${booking.room?.room_number} (${booking.room?.room_type?.name}) is now IN_USE.`);
      setTimeout(() => {
        setBooking(null);
        setSuccess("");
        handleSearchQuery(searchKeyword);
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 2: Confirm Check-Out & Settle Bill
  const confirmCheckOut = async () => {
    if (!booking) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/checkin/${booking.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          amount: customAmount || booking.total_amount || 0,
          transaction_ref: transactionRef || "TXN-COUNTER-" + Date.now(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Check-out failed");
      }

      setSuccess(`💳 Check-out & billing completed successfully! Room ${booking.room?.room_number} is now marked as DIRTY for Housekeeping.`);
      setTimeout(() => {
        setBooking(null);
        setSuccess("");
        handleSearchQuery(searchKeyword);
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: Process Instant Walk-In Check-In
  const confirmWalkInCheckIn = async () => {
    if (!selectedRoom) {
      setError("Please select an available room first.");
      return;
    }
    if (!guestForm.full_name || !guestForm.id_card_number) {
      setError("Please enter the guest full name and ID card number.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    const nights = calculateNights(walkInDates.check_in, walkInDates.check_out);
    const totalAmount = nights * (selectedRoom.room_type?.base_price || (selectedRoom.room_type as any)?.base_price_per_night || 0);

    try {
      // 1. Create booking
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          check_in_date: walkInDates.check_in,
          check_out_date: walkInDates.check_out,
          num_guests: walkInDates.num_guests,
          total_amount: totalAmount,
          special_requests: "Instant Walk-In Reservation at Front Desk",
        }),
      });

      if (!bookRes.ok) {
        const bookData = await bookRes.json();
        throw new Error(bookData.error || "Failed to create walk-in booking");
      }
      const newBooking = await bookRes.json();

      // 2. Immediately Check-In the guest
      const checkinRes = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: newBooking.id,
          guest: guestForm,
        }),
      });

      if (!checkinRes.ok) {
        const checkinData = await checkinRes.json();
        throw new Error(checkinData.error || "Booking created but check-in step failed");
      }

      setSuccess(`🚀 Walk-in Check-in Successful! Room ${selectedRoom.room_number} assigned to ${guestForm.full_name}. Room is now IN_USE.`);
      setTimeout(() => {
        setSelectedRoom(null);
        setGuestForm({
          full_name: "",
          id_card_number: "",
          id_card_type: "CCCD",
          nationality: "Vietnam",
          address: "",
        });
        setSuccess("");
        fetchAvailableRoomsForWalkIn();
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "CHECKED_IN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
      case "CHECKED_OUT":
        return "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) return <div className="container py-20 text-center">Loading...</div>;

  return (
    <div className="container py-10 mb-24 lg:mb-32 space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-neutral-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white flex items-center gap-3">
            <span>Front Desk Check-In & Check-Out Portal</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Verify guest identity, confirm arriving reservations, handle departure billing, and process instant walk-ins.
          </p>
        </div>

        {/* Operating Mode Tabs */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => { setActiveTab("checkin"); setBooking(null); setError(""); setSuccess(""); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "checkin"
                ? "bg-primary-6000 text-white shadow-md shadow-primary-6000/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Check-In Desk</span>
          </button>

          <button
            onClick={() => { setActiveTab("checkout"); setBooking(null); setError(""); setSuccess(""); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "checkout"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Check-Out & Billing</span>
          </button>

          <button
            onClick={() => { setActiveTab("walkin"); setBooking(null); setError(""); setSuccess(""); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "walkin"
                ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Walk-In Booking</span>
          </button>

          <button
            onClick={() => { setActiveTab("services"); setBooking(null); setError(""); setSuccess(""); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "services"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Phục Vụ & Dịch Vụ</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border border-green-200 text-green-800 dark:bg-green-950/60 dark:border-green-800 dark:text-green-200 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Layout depending on active tab */}
      {activeTab === "services" ? (
        <ReceptionistServiceHub />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Search / Selection List */}
        <div className="lg:col-span-6 space-y-6">
          {activeTab !== "walkin" ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center justify-between text-neutral-900 dark:text-white">
                <span>Step 1: Search & Select {activeTab === "checkout" ? "Checked-In Room" : "Reservation"}</span>
                <button
                  type="button"
                  onClick={() => handleSearchQuery(searchKeyword)}
                  className="text-xs text-primary-6000 hover:text-primary-700 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </h3>

              <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-6">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Search by Guest Name, Booking ID, or Room No..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 h-11 rounded-2xl"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <ButtonPrimary type="submit" disabled={isSearching} className="px-5 h-11 rounded-2xl text-sm font-bold">
                  Search
                </ButtonPrimary>
              </form>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {isSearching && (
                  <div className="py-12 text-center text-neutral-500 text-sm">Searching bookings...</div>
                )}

                {!isSearching && searchResults.length === 0 && (
                  <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    No matching {activeTab === "checkout" ? "CHECKED_IN" : "arriving"} reservations found.
                  </div>
                )}

                {!isSearching &&
                  searchResults.map((item) => {
                    const isSelected = booking?.id === item.id;
                    const isInvalid =
                      activeTab === "checkin"
                        ? item.status !== "CONFIRMED" && item.status !== "PENDING"
                        : item.status !== "CHECKED_IN";

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectBooking(item)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? "border-primary-6000 bg-primary-50/60 dark:bg-primary-950/30 ring-2 ring-primary-500/20 shadow-sm"
                            : isInvalid
                            ? "border-neutral-200 dark:border-neutral-800 opacity-50 bg-neutral-50 dark:bg-neutral-800/40"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-neutral-800/80"
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                              Room {item.room?.room_number} ({item.room?.room_type?.name})
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-3">
                            <span className="flex items-center gap-1 font-semibold truncate">
                              <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                              {item.user?.full_name || item.guest?.full_name || "Unknown Guest"}
                            </span>
                            {item.user?.phone && (
                              <span className="flex items-center gap-1 text-neutral-500 font-mono">
                                <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                {item.user.phone}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span>{item.check_in_date} &rarr; {item.check_out_date}</span>
                            <span className="font-bold text-neutral-700 dark:text-neutral-300 ml-1">
                              {formatMoney(item.total_amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 self-end sm:self-center">
                          {isSelected ? (
                            <span className="px-3 py-1 rounded-xl bg-primary-6000 text-white text-xs font-bold shadow-sm">
                              Selected
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                isInvalid
                                  ? "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
                              }`}
                            >
                              {isInvalid ? "Wrong Status" : "Select"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Walk-In Room Selection Step 1 */
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <h3 className="text-lg font-bold flex items-center justify-between text-neutral-900 dark:text-white">
                <span>Step 1: Pick Dates & Vacant Room</span>
                <button
                  type="button"
                  onClick={fetchAvailableRoomsForWalkIn}
                  className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Rooms
                </button>
              </h3>

              <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Check-In</label>
                  <Input
                    type="date"
                    value={walkInDates.check_in}
                    onChange={(e) => {
                      setWalkInDates({ ...walkInDates, check_in: e.target.value });
                      setTimeout(fetchAvailableRoomsForWalkIn, 100);
                    }}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Check-Out</label>
                  <Input
                    type="date"
                    value={walkInDates.check_out}
                    onChange={(e) => {
                      setWalkInDates({ ...walkInDates, check_out: e.target.value });
                      setTimeout(fetchAvailableRoomsForWalkIn, 100);
                    }}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {availableRooms.length === 0 ? (
                  <div className="py-10 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    No vacant rooms found for the selected dates.
                  </div>
                ) : (
                  availableRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? "border-green-600 bg-green-50/60 dark:bg-green-950/30 ring-2 ring-green-500/20 shadow-sm"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-green-500 bg-white dark:bg-neutral-800/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-neutral-900 dark:text-white">
                              Room {room.room_number}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                              Vacant
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mt-0.5">
                            {room.room_type?.name} &bull; Floor {room.floor}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-extrabold text-neutral-900 dark:text-white">
                            {formatMoney(room.room_type?.base_price || (room.room_type as any)?.base_price_per_night || 0)}
                          </div>
                          <div className="text-[10px] text-neutral-400">per night</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Panel: Step 3 Verification & Final Action */}
        <div className="lg:col-span-6 space-y-6">
          {/* Summary Card */}
          {activeTab !== "walkin" && booking ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-xl border border-neutral-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-52 h-52 bg-primary-6000/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="flex items-start justify-between pb-5 border-b border-neutral-700/80 mb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                    {activeTab === "checkout" ? "Departure Settlement Record" : "Reservation Verification Card"}
                  </span>
                  <h4 className="text-3xl font-extrabold mt-1">Room {booking.room?.room_number}</h4>
                  <p className="text-sm text-neutral-300 font-medium">{booking.room?.room_type?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusBadge(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div className="bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 block mb-0.5">Check-In Date</span>
                  <span className="font-bold text-white">{booking.check_in_date}</span>
                </div>
                <div className="bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 block mb-0.5">Check-Out Date</span>
                  <span className="font-bold text-white">{booking.check_out_date}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-sm bg-neutral-800/40 p-4.5 rounded-2xl border border-neutral-700/40 mb-5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Nights:</span>
                  <span className="font-bold">{calculateNights(booking.check_in_date, booking.check_out_date)} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Primary Guest:</span>
                  <span className="font-bold text-primary-300">{booking.user?.full_name || booking.guest?.full_name || "Guest"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Room Charge:</span>
                  <span className="font-extrabold text-white text-base">{formatMoney(booking.total_amount)}</span>
                </div>
              </div>
            </div>
          ) : activeTab === "walkin" && selectedRoom ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-green-950 via-neutral-900 to-neutral-900 text-white shadow-xl border border-green-800/60 relative overflow-hidden">
              <div className="flex items-start justify-between pb-5 border-b border-neutral-700/80 mb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-400">Walk-In Instant Booking Card</span>
                  <h4 className="text-3xl font-extrabold mt-1">Room {selectedRoom.room_number}</h4>
                  <p className="text-sm text-neutral-300 font-medium">{selectedRoom.room_type?.name}</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-green-100 text-green-900">Vacant</span>
              </div>
              <div className="space-y-2 text-sm bg-neutral-800/60 p-4 rounded-2xl border border-neutral-700/50">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Stay Duration:</span>
                  <span className="font-bold">{walkInDates.check_in} &rarr; {walkInDates.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Rate / Night:</span>
                  <span className="font-bold">{formatMoney(selectedRoom.room_type?.base_price || (selectedRoom.room_type as any)?.base_price_per_night || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-700/60">
                  <span className="text-neutral-300 font-bold">Estimated Total:</span>
                  <span className="font-extrabold text-green-400 text-base">
                    {formatMoney(calculateNights(walkInDates.check_in, walkInDates.check_out) * (selectedRoom.room_type?.base_price || (selectedRoom.room_type as any)?.base_price_per_night || 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-neutral-500">
              <Home className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-bold text-base text-neutral-700 dark:text-neutral-300">No Room or Reservation Selected</p>
              <p className="text-xs mt-1">Please select an item from Step 1 on the left to proceed with verification and actions.</p>
            </div>
          )}

          {/* Action Step 3 Console */}
          <div className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-opacity ${(!booking && activeTab !== "walkin") || (!selectedRoom && activeTab === "walkin") ? "opacity-50 pointer-events-none" : ""}`}>
            {activeTab === "checkout" ? (
              /* CHECK-OUT & BILLING PANEL */
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <span>Step 2: Bill Settlement & Check-Out</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["CARD", "CASH", "BANK_TRANSFER"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === method
                              ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                              : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <span>{method === "CARD" ? "💳 POS / Card" : method === "CASH" ? "💵 Cash" : "🏦 Bank Transfer"}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Amount to Settle (VND)</label>
                    <Input
                      type="number"
                      value={customAmount || booking?.total_amount || 0}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="h-11 font-bold text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Transaction / Receipt Ref</label>
                    <Input
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. TXN-998822 or CASH-RECEIPT-01"
                      className="h-11 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <ButtonPrimary
                    className="w-full h-12 text-base font-bold bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25"
                    onClick={confirmCheckOut}
                    loading={actionLoading}
                    disabled={actionLoading || !booking}
                  >
                    Confirm Check-Out & Settle Bill
                  </ButtonPrimary>
                </div>
              </div>
            ) : (
              /* CHECK-IN & WALKIN FORM PANEL */
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-6000" />
                  <span>Step 2: Guest Identity & Room Assignment</span>
                </h3>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">Full Name</span>
                    <Input
                      value={guestForm.full_name}
                      onChange={(e) => setGuestForm({ ...guestForm, full_name: e.target.value })}
                      className="mt-1.5 h-11 font-semibold"
                      placeholder="Enter guest full name"
                      required
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">ID Card Number</span>
                      <Input
                        value={guestForm.id_card_number}
                        onChange={(e) => setGuestForm({ ...guestForm, id_card_number: e.target.value })}
                        className="mt-1.5 h-11 font-mono"
                        placeholder="ID / Passport No."
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">ID Type</span>
                      <select
                        value={guestForm.id_card_type}
                        onChange={(e) => setGuestForm({ ...guestForm, id_card_type: e.target.value })}
                        className="block w-full text-sm rounded-2xl border-neutral-200 focus:border-primary-300 bg-white dark:border-neutral-700 dark:bg-neutral-900 mt-1.5 h-11 font-medium px-3"
                      >
                        <option value="CCCD">CCCD / CMND</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVERS_LICENSE">Driver's License</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">Nationality</span>
                      <Input
                        value={guestForm.nationality}
                        onChange={(e) => setGuestForm({ ...guestForm, nationality: e.target.value })}
                        className="mt-1.5 h-11 font-medium"
                      />
                    </label>
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">Address</span>
                      <Input
                        value={guestForm.address}
                        onChange={(e) => setGuestForm({ ...guestForm, address: e.target.value })}
                        className="mt-1.5 h-11 font-medium"
                        placeholder="Optional address"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {activeTab === "walkin" ? (
                    <ButtonPrimary
                      className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25"
                      onClick={confirmWalkInCheckIn}
                      loading={actionLoading}
                      disabled={actionLoading || !selectedRoom || !guestForm.full_name || !guestForm.id_card_number}
                    >
                      🚀 Create Walk-In Booking & Assign Room Now
                    </ButtonPrimary>
                  ) : (
                    <ButtonPrimary
                      className="w-full h-12 text-base font-bold shadow-lg shadow-primary-6000/25"
                      onClick={confirmCheckIn}
                      loading={actionLoading}
                      disabled={actionLoading || !booking || !guestForm.full_name || !guestForm.id_card_number}
                    >
                      Confirm Check-In & Assign Room
                    </ButtonPrimary>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Loading Check-In / Check-Out Console...</div>}>
      <CheckInContent />
    </Suspense>
  );
}
