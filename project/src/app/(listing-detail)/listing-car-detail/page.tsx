"use client";

import React, { FC, useState, useEffect, Suspense } from "react";
import { ArrowRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/hooks/useCurrency";
import CommentListing from "@/components/CommentListing";
import FiveStartIconForRate from "@/components/FiveStartIconForRate";
import StartRating from "@/components/StartRating";
import Avatar from "@/shared/Avatar";
import Badge from "@/shared/Badge";
import ButtonCircle from "@/shared/ButtonCircle";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonSecondary from "@/shared/ButtonSecondary";
import Input from "@/shared/Input";
import Image from "next/image";
import { Amenities_demos, includes_demo, PHOTOS } from "./constant";
import LikeSaveBtns from "@/components/LikeSaveBtns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SectionDateRange from "../SectionDateRange";
import RentalCarDatesRangeInput from "./RentalCarDatesRangeInput";
import { Route } from "next";
import { DEMO_CAR_LISTINGS } from "@/data/listings";

export interface ListingCarDetailPageProps {}

const ListingCarDetailPage: FC<ListingCarDetailPageProps> = ({}) => {
  const { formatPrice } = useCurrency();
  // USE STATE
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));

  const thisPathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const titleParam = searchParams.get("title") || "BMW 3 Series Sedan";

  const currentCar = DEMO_CAR_LISTINGS.find(
    (car) => car.title.toLowerCase() === titleParam.toLowerCase()
  );

  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [gplxFile, setGplxFile] = useState<any>(null);
  const [gplxFileName, setGplxFileName] = useState<string>("");
  const [gplxBase64, setGplxBase64] = useState<string>("");
  const [gplxCccd, setGplxCccd] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<{ start: Date; end: Date }[]>([]);

  useEffect(() => {
    if (user) {
      const fetchBookings = async () => {
        try {
          const res = await fetch("/api/bookings");
          if (res.ok) {
            const data = await res.json();
            const active = data.filter((b: any) => 
              b.user_id === user.id && ["CONFIRMED", "CHECKED_IN"].includes(b.status)
            );
            setActiveBookings(active);
            if (active.length > 0) {
              setSelectedBookingId(active[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to fetch bookings:", err);
        }
      };
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const res = await fetch(`/api/car-bookings`);
        if (res.ok) {
          const data = await res.json();
          const activeRentals = data.filter((cb: any) => 
            cb.car_type.toLowerCase() === titleParam.toLowerCase() && 
            ["waiting to return the vehicle", "return requested"].includes(cb.status_text)
          );
          const ranges = activeRentals.map((r: any) => ({
            start: new Date(r.pickup_date),
            end: new Date(r.dropoff_date),
          }));
          setBlockedDates(ranges);
        }
      } catch (err) {
        console.error("Failed to fetch blocked dates:", err);
      }
    };
    fetchBlockedDates();
  }, [titleParam]);

  const handleConfirmCarBooking = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thuê xe!");
      router.push("/hsrm-login" as any);
      return;
    }
    if (!selectedBookingId) {
      alert("Bạn cần phải có một phòng đặt đang hoạt động (Đã xác nhận hoặc Đang ở) để sử dụng dịch vụ thuê xe!");
      return;
    }
    if (!gplxFileName && !gplxFile) {
      alert("Bạn phải có GPLX để thuê xe.");
      return;
    }
    if (!gplxCccd.trim()) {
      alert("Vui lòng nhập số CCCD trên GPLX của bạn!");
      return;
    }
    if (!startDate || !endDate) {
      alert("Vui lòng chọn thời gian nhận xe và trả xe!");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch("/api/car-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBookingId,
          car_type: titleParam,
          pickup_date: startDate.toISOString(),
          dropoff_date: endDate.toISOString(),
          total_price: priceParam * daysCount + 15,
          gplx_image: gplxBase64 || gplxFileName || "gplx_manual_upload.png",
          gplx_cccd: gplxCccd,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Đặt xe thất bại.");
      }

      alert("🎉 Yêu cầu thuê xe đã được gửi! Lễ tân sẽ đối chiếu CCCD và phê duyệt sớm nhất. Bạn có thể kiểm tra trạng thái trong mục My Bookings.");
      router.push("/bookings" as any);
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi đăng ký thuê xe.");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(`/api/feedbacks?title=${encodeURIComponent(titleParam)}`);
        if (res.ok) {
          const data = await res.json();
          setFeedbacks(data);
        }
      } catch (err) {
        console.error("Failed to fetch feedbacks:", err);
      }
    };
    fetchFeedbacks();
  }, [titleParam]);

  const handleSubmitFeedback = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để gửi nhận xét!");
      return;
    }
    if (!commentInput.trim()) {
      alert("Vui lòng nhập nội dung nhận xét!");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: commentInput,
          rating: ratingInput,
          listing_title: titleParam,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gửi nhận xét thất bại.");
      }

      const newFeedback = await res.json();
      setFeedbacks((prev) => [newFeedback, ...prev]);
      setCommentInput("");
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi gửi nhận xét.");
    } finally {
      setSubmitLoading(false);
    }
  };
  const priceParam = Number(searchParams.get("price")) || 124;
  const imgParam = searchParams.get("img") || PHOTOS[0];
  const seatsParam = searchParams.get("seats") || "4";
  const gearshiftParam = searchParams.get("gearshift") || "Auto gearbox";

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days > 0 ? days : 1;
  };
  const daysCount = calculateDays();

  const handleOpenModalImageGallery = () => {
    router.push(`${thisPathname}/?modal=PHOTO_TOUR_SCROLLABLE` as Route);
  };

  const renderSection1 = () => {
    return (
      <div className="listingSection__wrap !space-y-6">
        {/* 1 */}
        <div className="flex justify-between items-center">
          <Badge color="pink" name="Car Rental" />
          <LikeSaveBtns />
        </div>

        {/* 2 */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold capitalize">
          {titleParam}
        </h2>

        {/* 3 */}
        <div className="flex items-center space-x-4">
          <StartRating />
          <span>·</span>
          <span>
            <i className="las la-map-marker-alt"></i>
            <span className="ml-1"> {currentCar?.address || "Tokyo, Japan"}</span>
          </span>
        </div>

        {/* 4 */}
        <div className="flex items-center">
          <Avatar hasChecked sizeClass="h-10 w-10" radius="rounded-full" imgUrl={currentCar?.author?.avatar} />
          <span className="ml-2.5 text-neutral-500 dark:text-neutral-400">
            Car owner{" "}
            <span className="text-neutral-900 dark:text-neutral-200 font-medium">
              {currentCar?.author?.displayName || "Kevin Francis"}
            </span>
          </span>
        </div>

        {/* 5 */}
        <div className="w-full border-b border-neutral-100 dark:border-neutral-700" />

        {/* 6 */}
        <div className="flex items-center justify-between xl:justify-start space-x-8 xl:space-x-12 text-sm text-neutral-700 dark:text-neutral-300">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-user-friends text-2xl"></i>
            <span className="">{seatsParam} seats</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-dharmachakra text-2xl"></i>
            <span className=""> {gearshiftParam}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-suitcase text-2xl"></i>
            <span className=""> 2 bags</span>
          </div>
        </div>
      </div>
    );
  };

  //
  const renderSectionTienIch = () => {
    return (
      <div className="listingSection__wrap">
        <div>
          <h2 className="text-2xl font-semibold">
            Vehicle parameters & utilities{" "}
          </h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            Questions are at the heart of making things great.
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* 6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-10 text-sm text-neutral-700 dark:text-neutral-300 ">
          {/* TIEN ICH 1 */}
          {Amenities_demos.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 ">
              <div className="w-10 flex-shrink-0">
                <Image src={item.icon} alt="" />
              </div>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSection2 = () => {
    const desc = currentCar?.description || `Until the all-new ${titleParam} hits the dealer showrooms you can check it out in our Showroom Walkaround video. Watch the video and join our product specialist as he gives you an up-close look of our latest vehicle.`;
    return (
      <div className="listingSection__wrap">
        <h2 className="text-2xl font-semibold">Car descriptions</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="text-neutral-6000 dark:text-neutral-300">
          <p className="whitespace-pre-line">
            {desc}
          </p>
        </div>
      </div>
    );
  };

  const renderSection3 = () => {
    return (
      <div className="listingSection__wrap">
        <div>
          <h2 className="text-2xl font-semibold">Include </h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            Included in the price
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* 6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm text-neutral-700 dark:text-neutral-300 ">
          {includes_demo
            .filter((_, i) => i < 12)
            .map((item) => (
              <div key={item.name} className="flex items-center space-x-3">
                <i className="las la-check-circle text-2xl"></i>
                <span>{item.name}</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderSection5 = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <h2 className="text-2xl font-semibold">Car Owner</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* host */}
        <div className="flex items-center space-x-4">
          <Avatar
            hasChecked
            hasCheckedClass="w-4 h-4 -top-0.5 right-0.5"
            sizeClass="h-14 w-14"
            radius="rounded-full"
            imgUrl={currentCar?.author?.avatar}
          />
          <div>
            <a className="block text-xl font-medium" href="##">
              {currentCar?.author?.displayName || "Kevin Francis"}
            </a>
            <div className="mt-1.5 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
              <StartRating />
              <span className="mx-2">·</span>
              <span> {currentCar?.author?.count || 12} places</span>
            </div>
          </div>
        </div>

        {/* desc */}
        <span className="block text-neutral-6000 dark:text-neutral-300">
          {currentCar?.author?.desc || "Providing lake views, The Symphony 9 Tam Coc in Ninh Binh provides accommodation, an outdoor swimming pool, a bar, a shared lounge, a garden and barbecue facilities..."}
        </span>

        {/* info */}
        <div className="block text-neutral-500 dark:text-neutral-400 space-y-2.5">
          <div className="flex items-center space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Joined in March 2016</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span>Response rate - 100%</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <span>Fast response - within a few hours</span>
          </div>
        </div>

        {/* == */}
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div>
          <ButtonSecondary href="/author">See host profile</ButtonSecondary>
        </div>
      </div>
    );
  };

  const renderSection6 = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <h2 className="text-2xl font-semibold">Reviews ({feedbacks.length} reviews)</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* Content */}
        <div className="space-y-5">
          <FiveStartIconForRate
            iconClass="w-6 h-6"
            className="space-x-0.5"
            defaultPoint={ratingInput}
            onChange={(p) => setRatingInput(p)}
          />
          <div className="relative">
            <Input
              fontClass=""
              sizeClass="h-16 px-4 py-3"
              rounded="rounded-3xl"
              placeholder={user ? "Share your thoughts ..." : "Đăng nhập để viết đánh giá..."}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              disabled={!user || submitLoading}
            />
            <ButtonCircle
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size=" w-12 h-12 "
              onClick={handleSubmitFeedback}
              disabled={!user || submitLoading}
            >
              <ArrowRightIcon className="w-5 h-5" />
            </ButtonCircle>
          </div>
        </div>

        {/* comment */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {feedbacks.length > 0 ? (
            feedbacks.map((item) => (
              <CommentListing
                key={item.id}
                className="py-8"
                data={{
                  name: item.user?.full_name || item.user?.email?.split("@")[0] || "Người dùng",
                  avatar: "",
                  date: new Date(item.created_at).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  }),
                  comment: item.comment,
                  starPoint: item.rating,
                }}
              />
            ))
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 py-8 text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn!</p>
          )}
        </div>
      </div>
    );
  };

  const renderSection7 = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <div>
          <h2 className="text-2xl font-semibold">Location</h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            {currentCar?.address || "Tokyo, Japan"}
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* MAP */}
        <div className="aspect-w-5 aspect-h-5 sm:aspect-h-3 ring-1 ring-black/10 rounded-xl z-0">
          <div className="rounded-xl overflow-hidden z-0">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAGVJfZMAKYfZ71nzL_v5i3LjTTWnCYwTY&q=Eiffel+Tower,Paris+France"
            ></iframe>
          </div>
        </div>
      </div>
    );
  };

  const renderSection8 = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <h2 className="text-2xl font-semibold">Things to know</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* CONTENT */}
        <div>
          <h4 className="text-lg font-semibold">Cancellation policy</h4>
          <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
            Lock in this fantastic price today, cancel free of charge anytime.
            Reserve now and pay at pick-up.
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* CONTENT */}
        <div>
          <h4 className="text-lg font-semibold">Special Note</h4>
          <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
            This {titleParam} is fully cleaned and sanitized before every rental. It is equipped with advanced safety features and premium amenities to ensure your absolute comfort and security during the trip.
          </span>
        </div>
      </div>
    );
  };

  const renderSidebarPrice = () => {
    return (
      <div className="listingSectionSidebar__wrap shadow-xl space-y-6">
        {/* PRICE */}
        <div className="flex justify-between">
          <span className="text-3xl font-semibold">
            {formatPrice(priceParam, "USD")}
            <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">
              /day
            </span>
          </span>
          <StartRating />
        </div>

        {/* FORM */}
        <form className="border border-neutral-200 dark:border-neutral-700 rounded-2xl">
          <RentalCarDatesRangeInput 
            startDate={startDate}
            endDate={endDate}
            excludeDateIntervals={blockedDates}
            onChangeDate={(dates) => {
              const [start, end] = dates;
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </form>

        {/* ROOM SELECTION LINK */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            Chọn phòng lưu trú liên kết:
          </label>
          {activeBookings.length > 0 ? (
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full text-sm rounded-2xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-primary-500 focus:border-primary-500 py-2.5"
            >
              {activeBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Phòng {b.room?.room_number} ({new Date(b.check_in_date).toLocaleDateString("vi-VN")} - {new Date(b.check_out_date).toLocaleDateString("vi-VN")})
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-2xl text-xs text-red-600 dark:text-red-400 font-semibold leading-relaxed">
              ⚠️ Bạn cần có phòng đặt hoạt động (Đã xác nhận hoặc Đang lưu trú) tại khách sạn để đăng ký thuê xe!
            </div>
          )}
        </div>

        {/* GPLX UPLOAD */}
        <div className="flex flex-col space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            Tải lên GPLX (Bắt buộc):
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setGplxFile(file);
                  setGplxFileName(file.name);
                  
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = new window.Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      let width = img.width;
                      let height = img.height;

                      const MAX_SIZE = 800;
                      if (width > height) {
                        if (width > MAX_SIZE) {
                          height = Math.round((height * MAX_SIZE) / width);
                          width = MAX_SIZE;
                        }
                      } else {
                        if (height > MAX_SIZE) {
                          width = Math.round((width * MAX_SIZE) / height);
                          height = MAX_SIZE;
                        }
                      }

                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
                        setGplxBase64(compressedBase64);
                      } else {
                        setGplxBase64(event.target?.result as string);
                      }
                    };
                    img.src = event.target?.result as string;
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="gplx-file-picker"
            />
            <label
              htmlFor="gplx-file-picker"
              className="cursor-pointer px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition-all whitespace-nowrap shadow-sm border border-neutral-200 dark:border-neutral-700"
            >
              📁 Chọn ảnh GPLX
            </label>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[170px]" title={gplxFileName}>
              {gplxFileName || "Chưa tải lên file"}
            </span>
          </div>
        </div>

        {/* CCCD INPUT */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            Số CCCD ghi trên GPLX:
          </label>
          <input
            type="text"
            value={gplxCccd}
            onChange={(e) => setGplxCccd(e.target.value)}
            placeholder="Nhập 12 số căn cước"
            maxLength={12}
            className="w-full text-sm rounded-2xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-primary-500 focus:border-primary-500 py-2.5 px-4"
          />
        </div>

        {/* SUM */}
        <div className="flex flex-col space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between text-sm text-neutral-6000 dark:text-neutral-300 font-medium">
            <span>{formatPrice(priceParam, "USD")} x {daysCount} ngày</span>
            <span>{formatPrice(priceParam * daysCount, "USD")}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500 font-medium">
            <span>Bảo hiểm & Phí dịch vụ:</span>
            <span>{formatPrice(15, "USD")}</span>
          </div>
          <div className="border-b border-neutral-100 dark:border-neutral-800"></div>
          <div className="flex justify-between font-bold text-base text-neutral-900 dark:text-white">
            <span>Tổng cộng:</span>
            <span>{formatPrice(priceParam * daysCount + 15, "USD")}</span>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <ButtonPrimary 
          onClick={handleConfirmCarBooking} 
          loading={bookingLoading} 
          disabled={bookingLoading}
          className="w-full h-12 text-sm font-extrabold shadow-lg"
        >
          Xác nhận thuê xe
        </ButtonPrimary>
      </div>
    );
  };

  const renderSidebarDetail = () => {
    return (
      <div className="listingSection__wrap lg:shadow-xl">
        <span className="text-2xl font-semibold block">
          Pick up and drop off
        </span>
        <div className="mt-8 flex">
          <div className="flex-shrink-0 flex flex-col items-center py-2">
            <span className="block w-6 h-6 rounded-full border border-neutral-400"></span>
            <span className="block flex-grow border-l border-neutral-400 border-dashed my-1"></span>
            <span className="block w-6 h-6 rounded-full border border-neutral-400"></span>
          </div>
          <div className="ml-4 space-y-14 text-sm">
            <div className="flex flex-col space-y-2">
              <span className=" text-neutral-500 dark:text-neutral-400">
                Monday, August 12 · 10:00
              </span>
              <span className=" font-semibold">
                Saint Petersburg City Center
              </span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className=" text-neutral-500 dark:text-neutral-400">
                Monday, August 16 · 10:00
              </span>
              <span className=" font-semibold">
                Saint Petersburg City Center
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const defaultPhotos = [imgParam, PHOTOS[1], PHOTOS[2], PHOTOS[3]];
  const carPhotos = (currentCar && currentCar.galleryImgs && currentCar.galleryImgs.length >= 4)
    ? currentCar.galleryImgs.slice(0, 4)
    : defaultPhotos;

  return (
    <div className={` nc-ListingCarDetailPage `}>
      {/* SINGLE HEADER */}
      <header className="rounded-md sm:rounded-xl">
        <div className="relative grid grid-cols-4 gap-1 sm:gap-2">
          <div
            className="col-span-2 row-span-2 relative rounded-md sm:rounded-xl overflow-hidden cursor-pointer"
            onClick={handleOpenModalImageGallery}
          >
            <Image
              fill
              src={carPhotos[0]}
              alt="photo 0"
              className="object-cover rounded-md sm:rounded-xl"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            />
            <div className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity"></div>
          </div>

          {/*  */}
          <div
            className="col-span-1 row-span-2 relative rounded-md sm:rounded-xl overflow-hidden cursor-pointer"
            onClick={handleOpenModalImageGallery}
          >
            <Image
              fill
              className="object-cover rounded-md sm:rounded-xl"
              src={carPhotos[1]}
              alt="photo 1"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity"></div>
          </div>

          {/*  */}
          {carPhotos.slice(2, 4).map((item, index) => (
            <div
              key={index}
              className="relative rounded-md sm:rounded-xl overflow-hidden"
            >
              <div className="aspect-w-4 aspect-h-3">
                <Image
                  fill
                  className="object-cover w-full h-full rounded-md sm:rounded-xl "
                  src={item || ""}
                  alt="photos"
                  sizes="400px"
                />
              </div>

              {/* OVERLAY */}
              <div
                className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleOpenModalImageGallery}
              />
            </div>
          ))}

          <div
            className="absolute hidden md:flex md:items-center md:justify-center left-3 bottom-3 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-500 cursor-pointer hover:bg-neutral-200 z-10"
            onClick={handleOpenModalImageGallery}
          >
            <Squares2X2Icon className="h-5 w-5" />

            <span className="ml-2 text-neutral-800 text-sm font-medium">
              Show all photos
            </span>
          </div>
        </div>
      </header>

      {/* MAIn */}
      <main className=" relative z-10 mt-11 flex flex-col lg:flex-row ">
        {/* CONTENT */}
        <div className="w-full lg:w-3/5 xl:w-2/3 space-y-8 lg:pr-10 lg:space-y-10">
          {renderSection1()}
          <div className="block lg:hidden">{renderSidebarDetail()}</div>
          {renderSectionTienIch()}
          {renderSection2()}
          {renderSection3()}
          <SectionDateRange />

          {renderSection5()}
          {renderSection6()}
          {renderSection7()}
          {renderSection8()}
        </div>

        {/* SIDEBAR */}
        <div className="block flex-grow mt-14 lg:mt-0">
          {renderSidebarDetail()}
          <div className="hidden lg:block mt-10 sticky top-28">
            {renderSidebarPrice()}
          </div>
        </div>
      </main>
    </div>
  );
};

const ListingCarDetailPageWithSuspense = () => {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Loading details...</div>}>
      <ListingCarDetailPage />
    </Suspense>
  );
};

export default ListingCarDetailPageWithSuspense;
