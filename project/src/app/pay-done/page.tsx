"use client";

import StartRating from "@/components/StartRating";
import React, { FC, useState, useEffect, Suspense } from "react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";

export interface PayPageProps {}

const PayPageContent: FC = () => {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const serviceOrderId = searchParams.get("serviceOrderId");
  const type = searchParams.get("type");
  const title = searchParams.get("title") || "The Lounge & Bar";
  const img = searchParams.get("img") || "https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
  const category = searchParams.get("category") || "Hotel room";
  const address = searchParams.get("address") || "Tokyo, Jappan";

  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch booking details
        const bookingRes = await fetch(`/api/bookings/${bookingId}`);
        if (!bookingRes.ok) {
          throw new Error("Không thể tải thông tin đặt phòng.");
        }
        const bData = await bookingRes.json();
        setBookingData(bData);

        // 2. Fetch service order if type is service
        if (type === "service" && serviceOrderId) {
          const ordersRes = await fetch(`/api/orders?booking_id=${bookingId}`);
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const specificOrder = orders.find((o: any) => o.id === serviceOrderId);
            if (specificOrder) {
              setOrderData(specificOrder);
            }
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu giao dịch.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, serviceOrderId, type]);

  const formatDateRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return "";
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    const start = new Date(startStr).toLocaleDateString("vi-VN", options);
    const end = new Date(endStr).toLocaleDateString("vi-VN", options);
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="container min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-6000 border-t-transparent"></div>
        <p className="text-neutral-500 dark:text-neutral-400">Đang tải thông tin giao dịch...</p>
      </div>
    );
  }

  if (error && !bookingData) {
    return (
      <div className="container min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 text-5xl">⚠️</div>
        <p className="text-neutral-800 dark:text-neutral-200 font-semibold">{error}</p>
        <ButtonPrimary href="/">Quay lại Trang chủ</ButtonPrimary>
      </div>
    );
  }

  const renderContent = () => {
    const isService = type === "service";

    return (
      <div className="w-full flex flex-col sm:rounded-2xl space-y-10 px-0 sm:p-6 xl:p-8">
        <h2 className="text-3xl lg:text-4xl font-semibold">
          Congratulation 🎉
        </h2>

        <div className="border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* ------------------------ */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Your {isService ? "order" : "booking"}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 w-full sm:w-40">
              <div className=" aspect-w-4 aspect-h-3 sm:aspect-h-4 rounded-2xl overflow-hidden">
                <Image
                  fill
                  alt=""
                  className="object-cover"
                  src={img}
                />
              </div>
            </div>
            <div className="pt-5  sm:pb-5 sm:px-5 space-y-3">
              <div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {isService ? "Dịch vụ gọi món & đồ uống" : `${category} in ${address}`}
                </span>
                <span className="text-base sm:text-lg font-medium mt-1 block">
                  {title}
                </span>
              </div>
              <span className="block  text-sm text-neutral-500 dark:text-neutral-400">
                {isService 
                  ? (bookingData?.room?.room_number ? `Giao tới Phòng ${bookingData.room.room_number} (Tầng ${bookingData.room.floor})` : "Dịch vụ phòng")
                  : (bookingData?.room ? `Phòng ${bookingData.room.room_number} - Tầng ${bookingData.room.floor} (${bookingData.room.room_type?.name || "Standard"})` : "2 beds · 2 baths")
                }
              </span>
              <div className="w-10 border-b border-neutral-200  dark:border-neutral-700"></div>
              <StartRating />
            </div>
          </div>
          <div className="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-3xl flex flex-col sm:flex-row divide-y sm:divide-x sm:divide-y-0 divide-neutral-200 dark:divide-neutral-700">
            <div className="flex-1 p-5 flex space-x-4">
              <svg
                className="w-8 h-8 text-neutral-300 dark:text-neutral-6000"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.33333 8.16667V3.5M18.6667 8.16667V3.5M8.16667 12.8333H19.8333M5.83333 24.5H22.1667C23.4553 24.5 24.5 23.4553 24.5 22.1667V8.16667C24.5 6.878 23.4553 5.83333 22.1667 5.83333H5.83333C4.54467 5.83333 3.5 6.878 3.5 8.16667V22.1667C3.5 23.4553 4.54467 24.5 5.83333 24.5Z"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex flex-col">
                <span className="text-sm text-neutral-400">Date</span>
                <span className="mt-1.5 text-lg font-semibold">
                  {isService 
                    ? (orderData ? new Date(orderData.created_at).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" }) : "Hôm nay")
                    : (bookingData ? formatDateRange(bookingData.check_in_date, bookingData.check_out_date) : "Aug 12 - 16, 2021")
                  }
                </span>
              </div>
            </div>
            <div className="flex-1 p-5 flex space-x-4">
              <svg
                className="w-8 h-8 text-neutral-300 dark:text-neutral-6000"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 5.07987C14.8551 4.11105 16.1062 3.5 17.5 3.5C20.0773 3.5 22.1667 5.58934 22.1667 8.16667C22.1667 10.744 20.0773 12.8333 17.5 12.8333C16.1062 12.8333 14.8551 12.2223 14 11.2535M17.5 24.5H3.5V23.3333C3.5 19.4673 6.63401 16.3333 10.5 16.3333C14.366 16.3333 17.5 19.4673 17.5 23.3333V24.5ZM17.5 24.5H24.5V23.3333C24.5 19.4673 21.366 16.3333 17.5 16.3333C16.225 16.3333 15.0296 16.6742 14 17.2698M15.1667 8.16667C15.1667 10.744 13.0773 12.8333 10.5 12.8333C7.92267 12.8333 5.83333 10.744 5.83333 8.16667C5.83333 5.58934 7.92267 3.5 10.5 3.5C13.0773 3.5 15.1667 5.58934 15.1667 8.16667Z"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex flex-col">
                <span className="text-sm text-neutral-400">{isService ? "Order Status" : "Guests"}</span>
                <span className="mt-1.5 text-lg font-semibold">
                  {isService 
                    ? (orderData?.status === "PENDING" ? "Đang chờ" : orderData?.status === "IN_PROGRESS" ? "Đang thực hiện" : orderData?.status === "COMPLETED" ? "Đã giao" : "Đã hủy")
                    : (bookingData ? `${bookingData.num_guests} khách` : "3 Guests")
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------ */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Giao dịch chi tiết</h3>
          <div className="flex flex-col space-y-4">
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">{isService ? "Mã đơn hàng" : "Mã đặt phòng"}</span>
              <span className="flex-1 font-mono font-medium text-neutral-900 dark:text-neutral-100 select-all">
                #{isService 
                  ? (orderData?.id?.slice(0, 8).toUpperCase() || "SERVICE_ORDER") 
                  : (bookingData?.id?.slice(0, 8).toUpperCase() || "BOOKING")
                }
              </span>
            </div>
            
            {/* If service, list food items */}
            {isService && orderData?.items && (
              <div className="flex flex-col space-y-2 py-2 border-y border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Danh sách món ăn:</span>
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300">
                    <span>{item.service?.name} x {item.quantity}</span>
                    <span>{formatPrice(item.subtotal, "VND")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Ngày thanh toán</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                {isService
                  ? (orderData ? new Date(orderData.created_at).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" }) : "")
                  : (bookingData ? new Date(bookingData.created_at).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" }) : "12 Aug, 2021")
                }
              </span>
            </div>
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Tổng tiền thanh toán</span>
              <span className="flex-1 font-bold text-neutral-900 dark:text-neutral-100 text-lg">
                {isService
                  ? (orderData ? formatPrice(orderData.total_amount, "VND") : "")
                  : (bookingData ? formatPrice(bookingData.total_amount, "USD") : "$199")
                }
              </span>
            </div>
            <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Phương thức thanh toán</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                VietQR (PayOS) / Chuyển khoản
              </span>
            </div>
          </div>
        </div>
        <div>
          <ButtonPrimary href="/">Explore more stays</ButtonPrimary>
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-PayPage`}>
      <main className="container mt-11 mb-24 lg:mb-32 ">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

const PayPage: FC<PayPageProps> = () => {
  return (
    <Suspense fallback={
      <div className="container min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-6000 border-t-transparent"></div>
        <p className="text-neutral-500 dark:text-neutral-400">Đang tải thông tin giao dịch...</p>
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
};

export default PayPage;
