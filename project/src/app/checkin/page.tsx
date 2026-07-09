"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import type { Booking, OcrResult } from "@/types/hotel";
import { Search, UploadCloud, CheckCircle2, AlertTriangle, Calendar, User, Home, FileText, Phone, RefreshCw } from "lucide-react";

export default function CheckInPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  const [guestForm, setGuestForm] = useState({
    full_name: "",
    id_card_number: "",
    id_card_type: "CCCD",
    nationality: "Vietnam",
    address: "",
  });

  const [checkInLoading, setCheckInLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role))) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Load recent confirmed/pending bookings when entering the page
  useEffect(() => {
    if (user && ["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      handleSearchQuery("");
    }
  }, [user]);

  const handleSearchQuery = async (query: string) => {
    setIsSearching(true);
    setError("");
    try {
      const url = query.trim() 
        ? `/api/bookings/search?query=${encodeURIComponent(query.trim())}` 
        : `/api/bookings/search`;
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
    if (["CANCELLED", "CHECKED_OUT"].includes(selected.status)) {
      setError(`Cannot check in: Selected booking is currently ${selected.status}.`);
      return;
    }
    if (selected.status === "CHECKED_IN") {
      setError(`Notice: This room is already CHECKED_IN.`);
    }
    setBooking(selected);
    // Pre-fill full_name if available and form is empty
    const defaultName = selected.user?.full_name || selected.guest?.full_name || "";
    if (defaultName && !guestForm.full_name) {
      setGuestForm(prev => ({ ...prev, full_name: defaultName }));
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setOcrLoading(true);

      const formData = new FormData();
      formData.append("image", selectedFile);

      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("OCR failed");

        const data = await res.json();
        setOcrResult(data);
        setGuestForm({
          full_name: data.full_name || guestForm.full_name || "",
          id_card_number: data.id_card_number || "",
          id_card_type: data.id_card_type || "CCCD",
          nationality: data.nationality || "Vietnam",
          address: data.address || "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setOcrLoading(false);
      }
    }
  };

  const confirmCheckIn = async () => {
    if (!booking) return;
    setCheckInLoading(true);
    setError("");
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

      setSuccess(`Check-in successful! Room ${booking.room?.room_number} (${booking.room?.room_type?.name}) is now IN_USE.`);
      // Refresh list and reset form
      setTimeout(() => {
        setBooking(null);
        setOcrResult(null);
        setFile(null);
        setSuccess("");
        handleSearchQuery(searchKeyword);
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckInLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "CONFIRMED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
      case "PENDING": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "CHECKED_IN": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
      case "CHECKED_OUT": return "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) return <div className="container py-20">Loading...</div>;

  return (
    <div className="container py-12 mb-24 lg:mb-32">
      <div className="mb-10">
        <h2 className="text-3xl font-bold sm:text-4xl text-neutral-900 dark:text-white">Reception Check-In Portal</h2>
        <p className="text-neutral-500 mt-2">Search reservations quickly by Guest Name, Booking ID, or Phone number, verify stay details, and confirm check-in instantly.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 mb-6 bg-green-100 border border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-300 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step 1: Search and Selection List */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between text-neutral-900 dark:text-white">
              <span>Step 1: Search & Select Reservation</span>
              <button 
                type="button" 
                onClick={() => handleSearchQuery(searchKeyword)}
                className="text-xs text-primary-6000 hover:text-primary-700 flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </h3>

            <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-6">
              <div className="relative flex-grow">
                <Input
                  placeholder="Search by Guest Name, Booking ID, or Phone..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <ButtonPrimary type="submit" disabled={isSearching} className="px-5">
                Search
              </ButtonPrimary>
            </form>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {isSearching && (
                <div className="py-12 text-center text-neutral-500 text-sm">Searching bookings...</div>
              )}

              {!isSearching && searchResults.length === 0 && (
                <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  No active reservations found matching "{searchKeyword}".
                </div>
              )}

              {!isSearching && searchResults.map((item) => {
                const isSelected = booking?.id === item.id;
                const isInvalid = ["CANCELLED", "CHECKED_OUT"].includes(item.status);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectBooking(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected 
                        ? "border-primary-6000 bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary-500/20 shadow-sm" 
                        : isInvalid 
                        ? "border-neutral-200 dark:border-neutral-800 opacity-60 bg-neutral-50 dark:bg-neutral-800/40"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-neutral-800/80"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          Room {item.room?.room_number} ({item.room?.room_type?.name})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-600 dark:text-neutral-300 flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium truncate">
                          <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          {item.user?.full_name || item.guest?.full_name || "Unknown Guest"}
                        </span>
                        {item.user?.phone && (
                          <span className="flex items-center gap-1 text-neutral-500">
                            <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            {item.user.phone}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        <span>{item.check_in_date} &rarr; {item.check_out_date}</span>
                        <span className="font-mono text-[10px]">({item.id.slice(0, 8)}...)</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 self-end sm:self-center">
                      {isSelected ? (
                        <span className="px-3 py-1 rounded-lg bg-primary-6000 text-white text-xs font-semibold shadow-sm">
                          Selected
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          isInvalid ? "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                        }`}>
                          {isInvalid ? "Unavailable" : "Select"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: AI OCR ID Scan */}
          <div className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-opacity ${!booking ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Step 2: Scan ID Card (AI OCR)</h3>
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <UploadCloud className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
              <label className="cursor-pointer text-primary-6000 hover:text-primary-700 font-semibold text-sm">
                <span>Upload Guest ID Card Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleOcrUpload} />
              </label>
              <p className="text-xs text-neutral-500 mt-1">AI will automatically extract Name, ID Number & Nationality</p>
            </div>
            {ocrLoading && <p className="text-center mt-3 text-sm text-primary-6000 font-medium animate-pulse">Scanning document with AI...</p>}
            {file && !ocrLoading && <p className="text-center mt-3 text-xs text-neutral-500">Uploaded file: {file.name}</p>}
          </div>
        </div>

        {/* Step 3: Validation Card & Check-In Action */}
        <div className="lg:col-span-6 space-y-6">
          {booking ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-xl border border-neutral-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-6000/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="flex items-start justify-between pb-4 border-b border-neutral-700/80 mb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">Reservation Validation Card</span>
                  <h4 className="text-2xl font-extrabold mt-1">Room {booking.room?.room_number}</h4>
                  <p className="text-sm text-neutral-300">{booking.room?.room_type?.name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${getStatusBadge(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/50">
                  <span className="text-xs text-neutral-400 block mb-0.5">Check-In Date</span>
                  <span className="font-bold text-white">{booking.check_in_date}</span>
                </div>
                <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/50">
                  <span className="text-xs text-neutral-400 block mb-0.5">Check-Out Date</span>
                  <span className="font-bold text-white">{booking.check_out_date}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-sm bg-neutral-800/40 p-4 rounded-xl border border-neutral-700/40 mb-5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Nights:</span>
                  <span className="font-bold">{calculateNights(booking.check_in_date, booking.check_out_date)} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Primary Guest:</span>
                  <span className="font-bold text-primary-300">{booking.user?.full_name || booking.guest?.full_name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Contact Email:</span>
                  <span className="font-mono text-xs">{booking.user?.email || "N/A"}</span>
                </div>
                {booking.user?.phone && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Phone Number:</span>
                    <span className="font-mono text-xs">{booking.user.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">Number of Guests:</span>
                  <span>{booking.num_guests} Person(s)</span>
                </div>
                <div className="pt-2 border-t border-neutral-700/60">
                  <span className="text-xs text-neutral-400 block mb-1">Special Requests:</span>
                  <p className="text-xs italic text-neutral-200 bg-neutral-900/50 p-2 rounded">
                    {booking.special_requests ? `"${booking.special_requests}"` : "None recorded for this reservation."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBooking(null)}
                className="text-xs text-neutral-400 hover:text-white underline transition-colors"
              >
                Change Selected Booking
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 text-center text-neutral-500">
              <Home className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-semibold text-base text-neutral-700 dark:text-neutral-300">No Booking Selected</p>
              <p className="text-xs mt-1">Please search and select a reservation from Step 1 on the left to review verification details.</p>
            </div>
          )}

          <div className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-opacity ${!booking ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-6000" />
              <span>Step 3: Confirm & Check-In</span>
            </h3>

            <div className="space-y-4">
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">Full Name</span>
                <Input
                  value={guestForm.full_name}
                  onChange={(e) => setGuestForm({...guestForm, full_name: e.target.value})}
                  className="mt-1.5"
                  placeholder="Enter guest full name"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">ID Card Number</span>
                  <Input
                    value={guestForm.id_card_number}
                    onChange={(e) => setGuestForm({...guestForm, id_card_number: e.target.value})}
                    className="mt-1.5"
                    placeholder="ID / Passport No."
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">ID Type</span>
                  <select
                    value={guestForm.id_card_type}
                    onChange={(e) => setGuestForm({...guestForm, id_card_type: e.target.value})}
                    className="block w-full text-sm rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900 mt-1.5 h-11"
                  >
                    <option value="CCCD">CCCD / CMND</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">Nationality</span>
                <Input
                  value={guestForm.nationality}
                  onChange={(e) => setGuestForm({...guestForm, nationality: e.target.value})}
                  className="mt-1.5"
                />
              </label>

              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">Address</span>
                <Input
                  value={guestForm.address}
                  onChange={(e) => setGuestForm({...guestForm, address: e.target.value})}
                  className="mt-1.5"
                  placeholder="Guest permanent/temporary address"
                />
              </label>
            </div>

            <div className="mt-8 pt-5 border-t border-neutral-200 dark:border-neutral-700">
              <ButtonPrimary
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary-6000/20"
                onClick={confirmCheckIn}
                loading={checkInLoading}
                disabled={checkInLoading || !guestForm.full_name || !guestForm.id_card_number}
              >
                Confirm Check-In & Assign Room
              </ButtonPrimary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
