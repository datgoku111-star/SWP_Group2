"use client";

import StartRating from "@/components/StartRating";
import React, { FC, useState, useEffect, Suspense } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";
import carsListingData from "@/data/jsons/__carsListing.json";

export interface PayPageProps {}

const PayPageContent: FC = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");
  const serviceOrderId = searchParams.get("serviceOrderId");
  const type = searchParams.get("type");
  const title = searchParams.get("title") || "The Lounge & Bar";
  const img = searchParams.get("img") || "https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
  const category = searchParams.get("category") || "Hotel room";
  const address = searchParams.get("address") || "Tokyo, Jappan";

  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState("");

  // Incident Form state
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentType, setIncidentType] = useState<string>("MAINTENANCE");
  const [incidentSeverity, setIncidentSeverity] = useState<string>("LOW");
  const [description, setDescription] = useState("");
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState("");
  const [incidentErrorMsg, setIncidentErrorMsg] = useState("");

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 10) {
      setIncidentErrorMsg("Mô tả sự cố phải có ít nhất 10 ký tự.");
      return;
    }
    setSubmittingIncident(true);
    setIncidentSuccessMsg("");
    setIncidentErrorMsg("");

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          room_id: bookingData?.room?.id,
          customer_id: bookingData?.user_id || user?.id || null,
          incident_type: incidentType,
          severity: incidentSeverity,
          description: description,
          estimated_charge: 0,
          is_chargeable: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gửi báo cáo sự cố thất bại.");
      }

      setIncidentSuccessMsg("Gửi báo cáo sự cố thành công! Ban quản lý khách sạn đã nhận được thông tin và đang xử lý.");
      setDescription("");
    } catch (err: any) {
      console.error(err);
      setIncidentErrorMsg(err.message || "Đã xảy ra lỗi kết nối khi gửi báo cáo.");
    } finally {
      setSubmittingIncident(false);
    }
  };

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

        // Trigger automated fallback confirmation of payment and booking status update
        await fetch(`/api/bookings/${bookingId}/confirm?serviceOrderId=${serviceOrderId || ""}`, {
          method: "POST",
        }).catch(err => console.error("Auto confirmation fallback error:", err));

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

    // Resolve booking type and details from database bookingData to prevent loss on redirect
    let displayTitle = title;
    let displayImg = img;
    let displayCategory = category;
    let displayAddress = address;
    let displaySubInfo = "";

    if (bookingData && !isService) {
      let isExp = false;
      let isCar = false;
      let meta: any = null;

      if (bookingData.special_requests) {
        try {
          meta = JSON.parse(bookingData.special_requests);
          if (meta) {
            if (meta.isExperience) isExp = true;
            if (meta.isCar) isCar = true;
          }
        } catch (e) {}
      }

      if (isExp) {
        const tourTitle = meta.title || "Experience Tour";
        const tourTitleLower = tourTitle.toLowerCase();
        
        displayTitle = tourTitle.charAt(0).toUpperCase() + tourTitle.slice(1);
        displayCategory = "Trải nghiệm";
        
        if (tourTitleLower.includes("climbing") || tourTitleLower.includes("leo núi")) {
          displayTitle = "Leo núi (Climbing Experience)";
          displayAddress = "Fansipan, Sapa";
          displayImg = "https://images.pexels.com/photos/5205846/pexels-photo-5205846.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";
        } else if (tourTitleLower.includes("rowing") || tourTitleLower.includes("chèo thuyền")) {
          displayTitle = "Chèo thuyền (Rowing Experience)";
          displayAddress = "Tràng An, Ninh Bình";
          displayImg = "https://images.pexels.com/photos/2583852/pexels-photo-2583852.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";
        } else if (tourTitleLower.includes("swimming") || tourTitleLower.includes("tắm biển")) {
          displayTitle = "Tắm biển (Swimming Experience)";
          displayAddress = "Bể bơi vô cực, Fis Hotel";
          displayImg = "https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";
        } else if (tourTitleLower.includes("skiing") || tourTitleLower.includes("trượt tuyết")) {
          displayTitle = "Trượt tuyết (Skiing Experience)";
          displayAddress = "Alpine Zone, Núi tuyết";
          displayImg = "https://images.pexels.com/photos/848618/pexels-photo-848618.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";
        } else {
          displayAddress = "Fis Hotel Resort";
          displayImg = "https://images.pexels.com/photos/5205846/pexels-photo-5205846.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";
        }
        
        displaySubInfo = "Trải nghiệm du lịch trọn gói";
      } else if (isCar) {
        const carTitle = meta.title || "Rental Car";
        displayTitle = carTitle;
        displayCategory = "Thuê xe";
        displayAddress = "Nhận xe tại quầy lễ tân";
        
        // Find car image
        const foundCar = carsListingData.find((c: any) => c.title.toLowerCase() === carTitle.toLowerCase());
        if (foundCar) {
          displayImg = foundCar.featuredImage || foundCar.galleryImgs?.[0] || img;
        } else {
          displayImg = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=compress&cs=tinysrgb&w=800";
        }
        
        displaySubInfo = "Dịch vụ thuê xe tự lái";
      } else {
        // Normal room booking
        displayTitle = title !== "The Lounge & Bar" ? title : (bookingData.room?.room_type?.name || "Hotel room");
        displayCategory = category;
        displayAddress = address;
        displaySubInfo = bookingData.room ? `Phòng ${bookingData.room.room_number} - Tầng ${bookingData.room.floor} (${bookingData.room.room_type?.name || "Standard"})` : "2 beds · 2 baths";
      }
    } else if (isService) {
      displaySubInfo = bookingData?.room?.room_number ? `Giao tới Phòng ${bookingData.room.room_number} (Tầng ${bookingData.room.floor})` : "Dịch vụ phòng";
    }

    return (
      <div className="w-full flex flex-col sm:rounded-2xl space-y-10 px-0 sm:p-6 xl:p-8">
        <h2 className="text-3xl lg:text-4xl font-semibold">
          {t("paydoneCongratulations")}
        </h2>

        <div className="border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* ------------------------ */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">{isService ? t("paydoneYourOrder") || "Your order" : t("paydoneYourBooking")}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 w-full sm:w-40">
              <div className=" aspect-w-4 aspect-h-3 sm:aspect-h-4 rounded-2xl overflow-hidden">
                <Image
                  fill
                  alt=""
                  className="object-cover"
                  src={displayImg}
                />
              </div>
            </div>
            <div className="pt-5  sm:pb-5 sm:px-5 space-y-3">
              <div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {isService ? "Dịch vụ gọi món & đồ uống" : `${displayCategory} in ${displayAddress}`}
                </span>
                <span className="text-base sm:text-lg font-medium mt-1 block">
                  {displayTitle}
                </span>
              </div>
              <span className="block  text-sm text-neutral-500 dark:text-neutral-400">
                {displaySubInfo}
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
                <span className="text-sm text-neutral-400">
                  {t("checkoutDateLabel")}
                </span>
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
                <span className="text-sm text-neutral-400">{isService ? "Order Status" : t("checkoutGuestsLabel")}</span>
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
          <h3 className="text-2xl font-semibold">{t("paydoneBookingDetail")}</h3>
          <div className="flex flex-col space-y-4">
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">{isService ? "Mã đơn hàng" : t("paydoneBookingCode")}</span>
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
              <span className="flex-1">{t("checkoutDateLabel")}</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                {isService
                  ? (orderData ? new Date(orderData.created_at).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" }) : "")
                  : (bookingData ? new Date(bookingData.created_at).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" }) : "12 Aug, 2021")
                }
              </span>
            </div>
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">{t("paydoneTotal")}</span>
              <span className="flex-1 font-bold text-neutral-900 dark:text-neutral-100 text-lg">
                {isService
                  ? (orderData ? formatPrice(orderData.total_amount, "VND") : "")
                  : (bookingData ? formatPrice(bookingData.total_amount, "USD") : "$199")
                }
              </span>
            </div>
            <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">{t("paydonePaymentMethod")}</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                VietQR (PayOS) / Chuyển khoản
              </span>
            </div>
          </div>
        </div>

        {!isService && bookingData && bookingData.room && (
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h4 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Báo cáo sự cố hoặc Yêu cầu đặc biệt
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Nếu bạn phát hiện sự cố phòng hoặc có yêu cầu dọn dẹp, bảo trì đặc biệt trước khi nhận phòng, vui lòng khai báo tại đây.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIncidentForm(!showIncidentForm)}
                className="flex-shrink-0 px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-full text-sm font-semibold transition"
              >
                {showIncidentForm ? "Đóng biểu mẫu" : "Khai báo ngay"}
              </button>
            </div>

            {showIncidentForm && (
              <form onSubmit={handleIncidentSubmit} className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                {incidentSuccessMsg && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-2xl text-sm font-medium">
                    ✓ {incidentSuccessMsg}
                  </div>
                )}
                {incidentErrorMsg && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl text-sm font-medium">
                    ⚠️ {incidentErrorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                      Phân loại yêu cầu / sự cố:
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-200"
                    >
                      <option value="MAINTENANCE">Bảo trì / Sửa chữa thiết bị (MAINTENANCE)</option>
                      <option value="COMPLAINT">Yêu cầu / Khiếu nại dịch vụ phòng (COMPLAINT)</option>
                      <option value="DAMAGE">Báo hỏng hóc đồ dùng (DAMAGE)</option>
                      <option value="MISSING_HOTEL_ITEM">Thiếu vật phẩm trong phòng (MISSING_HOTEL_ITEM)</option>
                      <option value="GUEST_LOST_ITEM">Báo thất lạc hành lý cá nhân (GUEST_LOST_ITEM)</option>
                      <option value="OTHER">Yêu cầu đặc biệt khác (OTHER)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                      Mức độ khẩn cấp:
                    </label>
                    <select
                      value={incidentSeverity}
                      onChange={(e) => setIncidentSeverity(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-200"
                    >
                      <option value="LOW">Thấp (LOW)</option>
                      <option value="MEDIUM">Trung bình (MEDIUM)</option>
                      <option value="HIGH">Cao (HIGH)</option>
                      <option value="CRITICAL">Khẩn cấp (CRITICAL)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                    Nội dung mô tả chi tiết:
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Mô tả cụ thể sự cố hoặc yêu cầu (ví dụ: chuẩn bị thêm chăn ấm, chuẩn bị giường cũi em bé, vòi nước rò rỉ...)"
                    className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-200"
                    required
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    * Vui lòng nhập tối thiểu 10 ký tự.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingIncident}
                  className="w-full md:w-auto px-6 py-3 bg-primary-6000 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingIncident ? "Đang gửi báo cáo..." : "Gửi yêu cầu sự cố"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <ButtonPrimary href={`/bookings/${bookingId}` as Route}>
            {isService ? "Xem chi tiết hóa đơn dịch vụ" : "Xem chi tiết hóa đơn đặt phòng"}
          </ButtonPrimary>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-full font-semibold transition text-sm"
          >
            Quay lại Trang chủ
          </button>
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
