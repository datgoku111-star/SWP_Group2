"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import type { Booking, OcrResult } from "@/types/hotel";
import { Search, UploadCloud } from "lucide-react";

export default function CheckInPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  
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

  const searchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBooking(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Booking not found");
      const data = await res.json();
      if (data.status !== "CONFIRMED") {
        throw new Error(`Cannot check in. Booking status is ${data.status}`);
      }
      setBooking(data);
    } catch (err: any) {
      setError(err.message);
    }
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
          full_name: data.full_name || "",
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

      setSuccess(`Check-in successful! Room ${booking.room?.room_number} is now IN_USE.`);
      setTimeout(() => {
        setBookingId("");
        setBooking(null);
        setOcrResult(null);
        setFile(null);
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckInLoading(false);
    }
  };

  if (isLoading) return <div className="container py-20">Loading...</div>;

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <h2 className="text-3xl font-semibold sm:text-4xl mb-10">Check-In Guest</h2>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 rounded-xl">{error}</div>
      )}
      {success && (
        <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-xl">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Step 1 & 2: Search and Upload */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Step 1: Find Booking</h3>
            <form onSubmit={searchBooking} className="flex gap-4">
              <Input
                placeholder="Enter Booking ID..."
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                required
                className="flex-grow"
              />
              <ButtonPrimary type="submit">
                <Search className="w-5 h-5 mr-2" />
                Search
              </ButtonPrimary>
            </form>

            {booking && (
              <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p><strong>Room:</strong> {booking.room?.room_type?.name} - {booking.room?.room_number}</p>
                <p><strong>Booked By:</strong> {booking.user?.full_name} ({booking.user?.email})</p>
                <p><strong>Dates:</strong> {booking.check_in_date} to {booking.check_out_date}</p>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm ${!booking ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-xl font-semibold mb-4">Step 2: Scan ID (AI OCR)</h3>
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <UploadCloud className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <label className="cursor-pointer text-primary-6000 hover:text-primary-700 font-medium">
                <span>Upload ID Card Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleOcrUpload} />
              </label>
              <p className="text-sm text-neutral-500 mt-2">JPEG, PNG up to 5MB</p>
            </div>
            {ocrLoading && <p className="text-center mt-4 text-primary-6000 animate-pulse">Scanning document with AI...</p>}
            {file && !ocrLoading && <p className="text-center mt-4 text-sm">Uploaded: {file.name}</p>}
          </div>
        </div>

        {/* Step 3: Verify and Confirm */}
        <div className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl ${!booking ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-xl font-semibold mb-4">Step 3: Verify Guest Details</h3>
          
          <div className="space-y-4">
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200 text-sm">Full Name</span>
              <Input
                value={guestForm.full_name}
                onChange={(e) => setGuestForm({...guestForm, full_name: e.target.value})}
                className="mt-1"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-sm">ID Card Number</span>
                <Input
                  value={guestForm.id_card_number}
                  onChange={(e) => setGuestForm({...guestForm, id_card_number: e.target.value})}
                  className="mt-1"
                  required
                />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200 text-sm">ID Type</span>
                <select
                  value={guestForm.id_card_type}
                  onChange={(e) => setGuestForm({...guestForm, id_card_type: e.target.value})}
                  className="block w-full text-sm rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900 mt-1"
                >
                  <option value="CCCD">CCCD / CMND</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200 text-sm">Nationality</span>
              <Input
                value={guestForm.nationality}
                onChange={(e) => setGuestForm({...guestForm, nationality: e.target.value})}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200 text-sm">Address</span>
              <Input
                value={guestForm.address}
                onChange={(e) => setGuestForm({...guestForm, address: e.target.value})}
                className="mt-1"
              />
            </label>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <ButtonPrimary 
              className="w-full h-12" 
              onClick={confirmCheckIn}
              loading={checkInLoading}
              disabled={checkInLoading || !guestForm.full_name || !guestForm.id_card_number}
            >
              Confirm Check-In
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
