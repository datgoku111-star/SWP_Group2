"use client";

import { Tab, Dialog, Transition } from "@headlessui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import React, { FC, Fragment, useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import visaPng from "@/images/vis.png";
import mastercardPng from "@/images/mastercard.svg";
import Input from "@/shared/Input";
import Label from "@/components/Label";
import Textarea from "@/shared/Textarea";
import ButtonPrimary from "@/shared/ButtonPrimary";
import StartRating from "@/components/StartRating";
import NcModal from "@/shared/NcModal";
import ModalSelectDate from "@/components/ModalSelectDate";
import converSelectedDateToString from "@/utils/converSelectedDateToString";
import ModalSelectGuests from "@/components/ModalSelectGuests";
import Image from "next/image";
import { GuestsObject } from "../(client-components)/type";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";

export interface CheckOutPagePageMainProps {
  className?: string;
}

const CheckOutPagePageMain: FC<CheckOutPagePageMainProps> = ({
  className = "",
}) => {
  {/*const searchParams = useSearchParams();*/}
    const searchParams = useSearchParams();
  const typeParam = searchParams.get("type"); // "service" hoặc null/room
  const bookingIdParam = searchParams.get("bookingId");
  const itemsParam = searchParams.get("items");
  {/* tay them */}
  const titleParam = searchParams.get("title") || "The Lounge & Bar";
  const priceParam = searchParams.get("price") || "19";
  const imgParam = searchParams.get("img") || "https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
  const categoryParam = searchParams.get("category") || "Hotel room";
  const addressParam = searchParams.get("address") || "Tokyo, Jappan";
  const bedsParam = searchParams.get("beds") || "2";

  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");

  const [startDate, setStartDate] = useState<Date | null>(
    checkInParam ? new Date(checkInParam) : new Date()
  );
  // Set default checkout date to tomorrow
  const [endDate, setEndDate] = useState<Date | null>(
    checkOutParam ? new Date(checkOutParam) : new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  );

  const [guests, setGuests] = useState<GuestsObject>({
    guestAdults: 1,
    guestChildren: 0,
    guestInfants: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0); // 0: paypal, 1: card, 2: payos
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    qrCode: string;
    amount: number;
    description: string;
    checkoutUrl: string;
    bookingId: string;
  } | null>(null);

  // Subscribe to real-time status updates on Supabase
  useEffect(() => {
    if (!showPayOSModal || !paymentInfo?.bookingId) return;

    const supabase = supabaseBrowser;
    const channel = supabase
      .channel(`booking-status-${paymentInfo.bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${paymentInfo.bookingId}`,
        },
        (payload) => {
          console.log("Real-time booking update:", payload);
          if (payload.new.status === "CONFIRMED") {
            setShowPayOSModal(false);
            router.push("/pay-done");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showPayOSModal, paymentInfo?.bookingId, router]);

  {/*const handlePayOSPayment = async (
    targetRoom: any,
    checkInStr: string,
    checkOutStr: string,
    totalAmount: number
  ) => {
    try {
      // 1. Call bookings API to create PENDING booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: targetRoom.id,
          check_in_date: checkInStr,
          check_out_date: checkOutStr,
          num_guests: (guests.guestAdults || 1) + (guests.guestChildren || 0),
          total_amount: totalAmount,
          special_requests: "",
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) {
        throw new Error(bookingData.error || "Failed to create booking.");
      }

      const bookingId = bookingData.id;

      // 2. Call Express Backend to generate payment link
      const payOSRes = await fetch("http://localhost:5000/api/payment/create-embedded-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          roomName: titleParam,
          totalPrice: totalAmount,
        }),
      });

      const payOSData = await payOSRes.json();
      if (!payOSRes.ok) {
        throw new Error(payOSData.error || "Failed to generate VietQR code.");
      }

      // 3. Open Modal and save payment info
      setPaymentInfo({
        qrCode: payOSData.qrCode,
        amount: payOSData.amount,
        description: payOSData.description,
        checkoutUrl: payOSData.checkoutUrl,
        bookingId,
      });
      setShowPayOSModal(true);

    } catch (err: any) {
      console.error("PayOS booking failed:", err);
      setError(err.message || "An unexpected error occurred during VietQR creation.");
    }
  }; */}

  const handlePayOSPayment = async (
    targetRoom: any,
    checkInStr: string,
    checkOutStr: string,
    totalAmount: number
  ) => {
    try {
      let bookingId = paymentInfo?.bookingId || "";
      let serviceOrderId = "";
      if (typeParam === "service") {
        // 1. Tạo đơn hàng dịch vụ dạng PENDING trước
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingIdParam,
            items: JSON.parse(itemsParam || "[]"),
            notes: "Paid via VietQR"
          }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");
        serviceOrderId = orderData.id;
        bookingId = bookingIdParam || "";
      } else {
        // Luồng đặt phòng cũ
        const bookingRes = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: targetRoom.id,
            check_in_date: checkInStr,
            check_out_date: checkOutStr,
            num_guests: (guests.guestAdults || 1) + (guests.guestChildren || 0),
            total_amount: totalAmount,
            special_requests: "",
          }),
        });
        const bookingData = await bookingRes.json();
        if (!bookingRes.ok) throw new Error(bookingData.error || "Failed to create booking.");
        bookingId = bookingData.id;
      }
      // 2. Gọi backend PayOS tạo mã thanh toán VietQR động
      const payOSRes = await fetch("http://localhost:5000/api/payment/create-embedded-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          serviceOrderId,
          type: typeParam || "room",
          roomName: titleParam,
          totalPrice: totalAmount,
        }),
      });
      const payOSData = await payOSRes.json();
      if (!payOSRes.ok) throw new Error(payOSData.error || "Failed to generate VietQR code.");
      setPaymentInfo({
        qrCode: payOSData.qrCode,
        amount: payOSData.amount,
        description: payOSData.description,
        checkoutUrl: payOSData.checkoutUrl,
        bookingId,
      });
      setShowPayOSModal(true);
    } catch (err: any) {
      console.error("PayOS failed:", err);
      setError(err.message || "An unexpected error occurred during VietQR creation.");
    }
  };   

  {/* tay them */}

  {/*const handleConfirmAndPay = async () => {
    if (!startDate || !endDate) {
      setError("Please select check-in and check-out dates.");
      return;
    }

    if (!user) {
      setError("You must be logged in to reserve a room.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const checkInStr = startDate.toISOString().split("T")[0];
      const checkOutStr = endDate.toISOString().split("T")[0];

      // 1. Fetch available rooms for these dates
      const roomsRes = await fetch(`/api/rooms?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
      if (!roomsRes.ok) {
        throw new Error("Failed to check room availability.");
      }

      const rooms = await roomsRes.json();
      if (!rooms || rooms.length === 0) {
        throw new Error("No rooms are available for the selected dates.");
      }

      // 2. Choose the first available room
      const targetRoom = rooms[0];

      // Calculate total amount based on room price and nights
      const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const pricePerNight = Number(priceParam) || targetRoom.room_type?.base_price || 100;
      const totalAmount = pricePerNight * nights;

      // 3. Routing payment flow
      if (activeTab === 2) {
        await handlePayOSPayment(targetRoom, checkInStr, checkOutStr, totalAmount);
        return;
      }

      // Traditional credit card / Paypal booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: targetRoom.id,
          check_in_date: checkInStr,
          check_out_date: checkOutStr,
          num_guests: (guests.guestAdults || 1) + (guests.guestChildren || 0),
          total_amount: totalAmount,
          special_requests: "",
        }),
      });

      const bookingData = await bookingRes.json();

      if (!bookingRes.ok) {
        throw new Error(bookingData.error || "Failed to create booking.");
      }

      // 4. Redirect to payment done page
      router.push("/pay-done");
    } catch (err: any) {
      console.error("Booking failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }; */}

  const handleConfirmAndPay = async () => {
    if (!user) {
      setError("You must be logged in to make a payment.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // XỬ LÝ CHO ĐƠN DỊCH VỤ ĐỒ ĂN
      if (typeParam === "service") {
        const totalAmount = Number(priceParam);
        if (activeTab === 2) {
          // Cổng VietQR (PayOS)
          await handlePayOSPayment(null, "", "", totalAmount);
          return;
        }
        // Cổng Paypal / Credit Card (Mô phỏng)
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingIdParam,
            items: JSON.parse(itemsParam || "[]"),
            notes: `Paid via ${activeTab === 0 ? "Paypal" : "Credit Card"}`
          }),
        });
        if (!orderRes.ok) {
          const errData = await orderRes.json();
          throw new Error(errData.error || "Failed to place food order.");
        }
        router.push("/pay-done");
        return;
      }
      // LUỒNG ĐẶT PHÒNG CŨ
      if (!startDate || !endDate) {
        throw new Error("Please select check-in and check-out dates.");
      }
      const checkInStr = startDate.toISOString().split("T")[0];
      const checkOutStr = endDate.toISOString().split("T")[0];
      const roomsRes = await fetch(`/api/rooms?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
      if (!roomsRes.ok) throw new Error("Failed to check room availability.");
      const rooms = await roomsRes.json();
      if (!rooms || rooms.length === 0) {
        throw new Error("No rooms are available for the selected dates.");
      }
      const targetRoom = rooms[0];
      const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const pricePerNight = Number(priceParam) || targetRoom.room_type?.base_price || 100;
      const totalAmount = pricePerNight * nights;
      if (activeTab === 2) {
        await handlePayOSPayment(targetRoom, checkInStr, checkOutStr, totalAmount);
        return;
      }
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: targetRoom.id,
          check_in_date: checkInStr,
          check_out_date: checkOutStr,
          num_guests: (guests.guestAdults || 1) + (guests.guestChildren || 0),
          total_amount: totalAmount,
          special_requests: "",
        }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || "Failed to create booking.");
      router.push("/pay-done");
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  {/* tay them */}

  const renderSidebar = () => {
    const nights = startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 1;
    const priceVal = Number(priceParam) || 19;
    const subtotal = priceVal * nights;
    const total = subtotal;

    return (
      <div className="w-full flex flex-col sm:rounded-2xl lg:border border-neutral-200 dark:border-neutral-700 space-y-6 sm:space-y-8 px-0 sm:p-6 xl:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="flex-shrink-0 w-full sm:w-40">
            <div className=" aspect-w-4 aspect-h-3 sm:aspect-h-4 rounded-2xl overflow-hidden">
              <Image
                alt=""
                fill
                sizes="200px"
                src={imgParam}
              />
            </div>
          </div>
          <div className="py-5 sm:px-5 space-y-3">
            <div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                {categoryParam} in {addressParam}
              </span>
              <span className="text-base font-medium mt-1 block">
                {titleParam}
              </span>
            </div>
            <span className="block  text-sm text-neutral-500 dark:text-neutral-400">
              {bedsParam} beds · 2 baths
            </span>
            <div className="w-10 border-b border-neutral-200  dark:border-neutral-700"></div>
            <StartRating />
          </div>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="text-2xl font-semibold">Price detail</h3>
          <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
            <span>${priceVal} x {nights} day{nights > 1 ? "s" : ""}</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
            <span>Service charge</span>
            <span>$0</span>
          </div>

          <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMain = () => {
    return (
      <div className="w-full flex flex-col sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-8 px-0 sm:p-6 xl:p-8">
        <h2 className="text-3xl lg:text-4xl font-semibold">
          Confirm and payment
        </h2>
        <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
        <div>
          <div>
            <h3 className="text-2xl font-semibold">Your trip</h3>
            <NcModal
              renderTrigger={(openModal) => (
                <span
                  onClick={() => openModal()}
                  className="block lg:hidden underline  mt-1 cursor-pointer"
                >
                  View booking details
                </span>
              )}
              renderContent={renderSidebar}
              modalTitle="Booking details"
            />
          </div>
          <div className="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-3xl flex flex-col sm:flex-row divide-y sm:divide-x sm:divide-y-0 divide-neutral-200 dark:divide-neutral-700 overflow-hidden z-10">
            <ModalSelectDate
              renderChildren={({ openModal }) => (
                <button
                  onClick={openModal}
                  className="text-left flex-1 p-5 flex justify-between space-x-5 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  type="button"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-400">Date</span>
                    <span className="mt-1.5 text-lg font-semibold">
                      {converSelectedDateToString([startDate, endDate])}
                    </span>
                  </div>
                  <PencilSquareIcon className="w-6 h-6 text-neutral-6000 dark:text-neutral-400" />
                </button>
              )}
            />

            <ModalSelectGuests
              renderChildren={({ openModal }) => (
                <button
                  type="button"
                  onClick={openModal}
                  className="text-left flex-1 p-5 flex justify-between space-x-5 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-400">Guests</span>
                    <span className="mt-1.5 text-lg font-semibold">
                      <span className="line-clamp-1">
                        {`${
                          (guests.guestAdults || 0) +
                          (guests.guestChildren || 0)
                        } Guests, ${guests.guestInfants || 0} Infants`}
                      </span>
                    </span>
                  </div>
                  <PencilSquareIcon className="w-6 h-6 text-neutral-6000 dark:text-neutral-400" />
                </button>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Pay with</h3>
          <div className="w-14 border-b border-neutral-200 dark:border-neutral-700 my-5"></div>

          <div className="mt-6">
            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
              <Tab.List className="flex my-5 gap-1 overflow-x-auto pb-1">
                <Tab as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full focus:outline-none whitespace-nowrap ${
                        selected
                          ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                          : "text-neutral-6000 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      Paypal
                    </button>
                  )}
                </Tab>
                <Tab as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`px-4 py-1.5 sm:px-6 sm:py-2.5  rounded-full flex items-center justify-center focus:outline-none whitespace-nowrap ${
                        selected
                          ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                          : " text-neutral-6000 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span className="mr-2.5">Credit card</span>
                      <Image className="w-8" src={visaPng} alt="visa" />
                      <Image
                        className="w-8"
                        src={mastercardPng}
                        alt="mastercard"
                      />
                    </button>
                  )}
                </Tab>
                <Tab as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full focus:outline-none whitespace-nowrap ${
                        selected
                          ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                          : "text-neutral-6000 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      VietQR (PayOS)
                    </button>
                  )}
                </Tab>
              </Tab.List>

              <Tab.Panels>
                {/* Paypal */}
                <Tab.Panel className="space-y-5">
                  <div className="space-y-1">
                    <Label>Email </Label>
                    <Input type="email" defaultValue="example@gmail.com" />
                  </div>
                  <div className="space-y-1">
                    <Label>Password </Label>
                    <Input type="password" defaultValue="***" />
                  </div>
                  <div className="space-y-1">
                    <Label>Messager for author </Label>
                    <Textarea placeholder="..." />
                    <span className="text-sm text-neutral-500 block">
                      Write a few sentences about yourself.
                    </span>
                  </div>
                </Tab.Panel>

                {/* Credit Card */}
                <Tab.Panel className="space-y-5">
                  <div className="space-y-1">
                    <Label>Card number </Label>
                    <Input defaultValue="111 112 222 999" />
                  </div>
                  <div className="space-y-1">
                    <Label>Card holder </Label>
                    <Input defaultValue="JOHN DOE" />
                  </div>
                  <div className="flex space-x-5  ">
                    <div className="flex-1 space-y-1">
                      <Label>Expiration date </Label>
                      <Input type="date" defaultValue="MM/YY" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label>CVC </Label>
                      <Input />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Messager for author </Label>
                    <Textarea placeholder="..." />
                    <span className="text-sm text-neutral-500 block">
                      Write a few sentences about yourself.
                    </span>
                  </div>
                </Tab.Panel>

                {/* VietQR (PayOS) */}
                <Tab.Panel className="space-y-5">
                  <div className="p-5 bg-blue-50/50 dark:bg-neutral-800 rounded-2xl border border-blue-100/30 dark:border-neutral-700 space-y-3">
                    <div className="flex items-center space-x-3 text-neutral-800 dark:text-neutral-200">
                      <span className="text-2xl">🇻🇳</span>
                      <h4 className="font-semibold text-base">Thanh toán an toàn bằng VietQR (PayOS)</h4>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Mã chuyển khoản VietQR động 24/7 sẽ được tạo tự động bởi cổng thanh toán cổng **PayOS** (đối tác cổng thanh toán ngân hàng chính thức). Bạn chỉ cần mở app ngân hàng quét mã và thanh toán. Phòng của bạn sẽ được xác nhận tự động ngay sau khi chuyển khoản thành công.
                    </p>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm mt-4">
                {error}
              </div>
            )}
            <div className="pt-8">
              <ButtonPrimary onClick={handleConfirmAndPay} loading={loading} disabled={loading}>
                Confirm and pay
              </ButtonPrimary>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPayOSModal = () => {
    if (!paymentInfo) return null;

    return (
      <Transition appear show={showPayOSModal} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => setShowPayOSModal(false)}
        >
          <div className="min-h-screen px-4 text-center">
             <Transition.Child
               as={Fragment}
               enter="ease-out duration-300"
               enterFrom="opacity-0"
               enterTo="opacity-100"
               leave="ease-in duration-200"
               leaveFrom="opacity-100"
               leaveTo="opacity-0"
             >
               <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-65 transition-opacity" />
             </Transition.Child>

             {/* Trick browser to center modal */}
             <span
               className="inline-block h-screen align-middle"
               aria-hidden="true"
             >
               &#8203;
             </span>

             <Transition.Child
               as={Fragment}
               enter="ease-out duration-300"
               enterFrom="opacity-0 scale-95"
               enterTo="opacity-100 scale-100"
               leave="ease-in duration-200"
               leaveFrom="opacity-100 scale-100"
               leaveTo="opacity-0 scale-95"
             >
               <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl">
                 <Dialog.Title
                   as="h3"
                   className="text-lg font-bold text-center text-neutral-950 dark:text-neutral-100 flex items-center justify-center gap-2"
                 >
                   <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                   Quét mã VietQR để thanh toán
                 </Dialog.Title>

                 <div className="mt-4 flex flex-col items-center space-y-4">
                   {/* QR Code Container */}
                   <div className="relative p-4 bg-white rounded-2xl border border-neutral-100 shadow-inner flex items-center justify-center w-64 h-64 overflow-hidden group">
                     {/* QR Image */}
                     <img
                       src={paymentInfo.qrCode}
                       alt="VietQR Code"
                       className="w-full h-full object-contain"
                     />
                     {/* Scanning Animation line */}
                     <div className="absolute left-0 right-0 h-0.5 bg-primary-500 opacity-60 animate-bounce top-0 group-hover:block"></div>
                   </div>

                   {/* Price and info */}
                   <div className="w-full bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl space-y-2.5 border border-neutral-100 dark:border-neutral-800">
                     <div className="flex justify-between text-sm">
                       <span className="text-neutral-500 dark:text-neutral-400">Số tiền:</span>
                       <span className="font-bold text-secondary-6000 text-base">
                         {paymentInfo.amount.toLocaleString("vi-VN")} VND
                       </span>
                     </div>
                     <div className="flex justify-between text-sm items-start">
                       <span className="text-neutral-500 dark:text-neutral-400">Nội dung CK:</span>
                       <div className="flex items-center gap-1.5">
                         <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 select-all">
                           {paymentInfo.description}
                         </span>
                         <button
                           onClick={() => {
                             navigator.clipboard.writeText(paymentInfo.description);
                             alert("Đã sao chép nội dung chuyển khoản!");
                           }}
                           className="text-xs text-primary-500 underline hover:text-primary-600"
                         >
                           Sao chép
                         </button>
                       </div>
                     </div>
                   </div>

                   <p className="text-xs text-center text-neutral-500 leading-relaxed px-2">
                     * Vui lòng nhập đúng nội dung chuyển khoản ở trên để hệ thống tự động xác nhận đơn phòng của bạn ngay lập tức.
                   </p>

                   {/* Actions */}
                   <div className="w-full flex flex-col space-y-2 pt-2">
                     <a
                       href={paymentInfo.checkoutUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium text-center rounded-xl transition-all shadow-md text-sm"
                     >
                       Thanh toán qua trang PayOS →
                     </a>
                     <button
                       type="button"
                       onClick={() => setShowPayOSModal(false)}
                       className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-center rounded-xl font-medium text-sm transition-all"
                     >
                       Hủy thanh toán
                     </button>
                   </div>
                 </div>
               </div>
             </Transition.Child>
           </div>
         </Dialog>
       </Transition>
     );
   };

  return (
    <div className={`nc-CheckOutPagePageMain ${className}`}>
      <main className="container mt-11 mb-24 lg:mb-32 flex flex-col-reverse lg:flex-row">
        <div className="w-full lg:w-3/5 xl:w-2/3 lg:pr-10 ">{renderMain()}</div>
        <div className="hidden lg:block flex-grow">{renderSidebar()}</div>
      </main>
      {renderPayOSModal()}
    </div>
  );
};

export default CheckOutPagePageMain;
