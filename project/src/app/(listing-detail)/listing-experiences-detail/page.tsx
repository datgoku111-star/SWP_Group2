"use client";

import React, { FC, useState, useEffect, Suspense } from "react";
import { ArrowRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import CommentListing from "@/components/CommentListing";
import FiveStartIconForRate from "@/components/FiveStartIconForRate";
import Avatar from "@/shared/Avatar";
import Badge from "@/shared/Badge";
import ButtonCircle from "@/shared/ButtonCircle";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonSecondary from "@/shared/ButtonSecondary";
import Input from "@/shared/Input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LikeSaveBtns from "@/components/LikeSaveBtns";
import StartRating from "@/components/StartRating";
import { includes_demo, PHOTOS } from "./constant";
import Image from "next/image";
import StayDatesRangeInput from "./StayDatesRangeInput";
import GuestsInput from "./GuestsInput";
import SectionDateRange from "../SectionDateRange";
import { Route } from "next";

export interface ListingExperiencesDetailPageProps {}

const ListingExperiencesDetailPage: FC<
  ListingExperiencesDetailPageProps
> = ({}) => {
  const searchParams = useSearchParams();
  const titleParam = searchParams.get("title") || "Trang An Boat Tour & Mua Cave";
  const priceParam = searchParams.get("price") || "199";
  const imgParam = searchParams.get("img") || "";
  const categoryParam = searchParams.get("category") || "Specific Tour";
  const addressParam = searchParams.get("address") || "Tokyo, Jappan";

  const [startDate, setStartDate] = useState<Date | null>(new Date("2023/02/06"));
  const [endDate, setEndDate] = useState<Date | null>(new Date("2023/02/23"));

  const thisPathname = usePathname();
  const router = useRouter();

  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const handleOpenModalImageGallery = () => {
    router.push(`${thisPathname}/?modal=PHOTO_TOUR_SCROLLABLE` as Route);
  };

  const renderSection1 = () => {
    return (
      <div className="listingSection__wrap !space-y-6">
        {/* 1 */}
        <div className="flex justify-between items-center">
          <Badge color="pink" name={categoryParam} />
          <LikeSaveBtns />
        </div>

        {/* 2 */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
          {titleParam}
        </h2>

        {/* 3 */}
        <div className="flex items-center space-x-4">
          <StartRating />
          <span>·</span>
          <span>
            <i className="las la-map-marker-alt"></i>
            <span className="ml-1"> {addressParam}</span>
          </span>
        </div>

        {/* 4 */}
        <div className="flex items-center">
          <Avatar hasChecked sizeClass="h-10 w-10" radius="rounded-full" />
          <span className="ml-2.5 text-neutral-500 dark:text-neutral-400">
            Hosted by{" "}
            <span className="text-neutral-900 dark:text-neutral-200 font-medium">
              Kevin Francis
            </span>
          </span>
        </div>

        {/* 5 */}
        <div className="w-full border-b border-neutral-100 dark:border-neutral-700" />

        {/* 6 */}
        <div className="flex items-center justify-between xl:justify-start space-x-8 xl:space-x-12 text-sm text-neutral-700 dark:text-neutral-300">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-clock text-2xl"></i>
            <span className="">3.5 hours</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-user-friends text-2xl"></i>
            <span className="">Up to 10 people</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-language text-2xl"></i>
            <span className="">English, VietNames</span>
          </div>
        </div>
      </div>
    );
  };

  const getExperienceDescription = () => {
    const titleLower = titleParam.toLowerCase();
    
    // 1. Water & Boat Adventure
    if (
      titleLower.includes("market") ||
      titleLower.includes("interactive") ||
      titleLower.includes("boat") ||
      titleLower.includes("water") ||
      titleLower.includes("river") ||
      titleLower.includes("sea") ||
      titleLower.includes("lake") ||
      titleLower.includes("grotto") ||
      titleLower.includes("trang an")
    ) {
      return {
        p1: `Prepare for a spectacular journey with ${titleParam}, a scenic water and boating experience situated in the beautiful area of ${addressParam}. Perfect for nature lovers and adventurers, this rowing boat and water exploration tour starts at just $${priceParam} per person.`,
        p2: `Hop on a comfortable, guided boat to cruise along pristine waterways, surrounded by breathtaking mountain cliffs and lush green landscapes. All safety jackets, boat fees, and local guides are included in the price.`,
        p3: `Be sure to bring a camera, sun protection, and light clothing. Enjoy a peaceful and relaxing day on the water, widely regarded as a top activity in the area.`
      };
    }
    
    // 2. Mountain & Hiking Adventure
    if (
      titleLower.includes("hiking") ||
      titleLower.includes("climbing") ||
      titleLower.includes("rock") ||
      titleLower.includes("mountain") ||
      titleLower.includes("backpacking") ||
      titleLower.includes("trek") ||
      titleLower.includes("outdoor") ||
      titleLower.includes("cave") ||
      titleLower.includes("forest") ||
      titleLower.includes("rope") ||
      titleLower.includes("deploy") ||
      titleLower.includes("integrated") ||
      titleLower.includes("solutions")
    ) {
      return {
        p1: `Get ready to explore the great outdoors with ${titleParam}, an immersive hiking and climbing adventure located in ${addressParam}. Challenge yourself and enjoy panoramic views starting at just $${priceParam} per person.`,
        p2: `Our professional trekking guides will lead you along scenic trails, sharing details about the local ecology and geography. The experience includes climbing gear, water, and park entry permits.`,
        p3: `We recommend wearing sturdy hiking shoes, comfortable athletic wear, and bringing a small backpack. This adventure is suitable for intermediate to active travelers seeking unforgettable views.`
      };
    }
    
    // 3. Surfing & Watersports Lesson
    if (
      titleLower.includes("surf") ||
      titleLower.includes("holistic") ||
      titleLower.includes("deliverables") ||
      titleLower.includes("productize")
    ) {
      return {
        p1: `Ride the waves with ${titleParam}, an exciting surfing and paddleboarding session at the beaches of ${addressParam}. Ideal for all skill levels, this lesson starts at just $${priceParam} per person.`,
        p2: `Learn from certified instructors who will teach you paddling techniques, board safety, and wave timing. High-quality surfboards, wetsuits, and security leash are provided.`,
        p3: `Please bring swimwear, towels, and sunblock. Meet other surfing enthusiasts and build your confidence in the water in a friendly, supportive environment.`
      };
    }

    // 4. Health & Fitness Workshop
    if (
      titleLower.includes("e-services") ||
      titleLower.includes("deliver") ||
      titleLower.includes("dynamic") ||
      titleLower.includes("fitness") ||
      titleLower.includes("yoga") ||
      titleLower.includes("stretch") ||
      titleLower.includes("run") ||
      titleLower.includes("workout")
    ) {
      return {
        p1: `Revitalize your body and mind with ${titleParam}, a wellness and fitness experience held in the serene settings of ${addressParam}. This guided activity starts at just $${priceParam} per person.`,
        p2: `Our instructors will guide you through tailored stretching, yoga, or workout routines to boost energy and flexibility. Yoga mats, refreshing wellness drinks, and towels are fully included.`,
        p3: `Wear comfortable exercise clothing. Perfect for anyone looking to stay active, release stress, and connect with like-minded individuals during their travel.`
      };
    }

    // 5. Culinary & Local Food Tasting
    if (
      titleLower.includes("cook") ||
      titleLower.includes("chef") ||
      titleLower.includes("food") ||
      titleLower.includes("dining") ||
      titleLower.includes("culinary") ||
      titleLower.includes("eat") ||
      titleLower.includes("coffee") ||
      titleLower.includes("restaurant")
    ) {
      return {
        p1: `Indulge in local flavors with ${titleParam}, a culinary and food tasting journey through the local hotspots of ${addressParam}. Taste traditional dishes starting at just $${priceParam} per person.`,
        p2: `Led by an expert food guide or chef, you will visit authentic eateries, learn about cooking techniques, and taste signature local ingredients. All food, beverages, and tastings are included.`,
        p3: `Come hungry! We accommodate vegetarian and dietary restrictions with advance notice. Discover the culinary heritage and stories behind the local cuisine.`
      };
    }

    // 6. Default
    return {
      p1: `Embark on the spectacular ${titleParam}, a highly-rated ${categoryParam.toLowerCase()} experience based in the scenic region of ${addressParam}. Perfect for adventure seekers and culture enthusiasts, this activity starts at just $${priceParam} per person.`,
      p2: `Our expert local guides will accompany you throughout the journey, sharing fascinating history, architecture, and stories. The experience includes all safety equipment, admissions, and transport.`,
      p3: `Be sure to bring comfortable walking shoes, weather-appropriate clothing, and your camera. Meet other travelers and enjoy a memorable outing in the area.`
    };
  };

  const renderSection2 = () => {
    const { p1, p2, p3 } = getExperienceDescription();
    return (
      <div className="listingSection__wrap">
        <h2 className="text-2xl font-semibold">Experiences descriptions</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="text-neutral-6000 dark:text-neutral-300 space-y-4">
          <p>{p1}</p>
          <p>{p2}</p>
          <p>{p3}</p>
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
        <h2 className="text-2xl font-semibold">Host Information</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* host */}
        <div className="flex items-center space-x-4">
          <Avatar
            hasChecked
            hasCheckedClass="w-4 h-4 -top-0.5 right-0.5"
            sizeClass="h-14 w-14"
            radius="rounded-full"
          />
          <div>
            <a className="block text-xl font-medium" href="##">
              Kevin Francis
            </a>
            <div className="mt-1.5 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
              <StartRating />
              <span className="mx-2">·</span>
              <span> 12 places</span>
            </div>
          </div>
        </div>

        {/* desc */}
        <span className="block text-neutral-6000 dark:text-neutral-300">
          Providing lake views, The Symphony 9 Tam Coc in Ninh Binh provides
          accommodation, an outdoor swimming pool, a bar, a shared lounge, a
          garden and barbecue facilities...
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
            San Diego, CA, United States of America (SAN-San Diego Intl.)
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
            Any experience can be canceled and fully refunded within 24 hours of
            purchase, or at least 7 days before the experience starts.
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* CONTENT */}
        <div>
          <h4 className="text-lg font-semibold">Guest requirements</h4>
          <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
            Up to 10 guests ages 4 and up can attend. Parents may also bring
            children under 2 years of age.
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* CONTENT */}
        <div>
          <h4 className="text-lg font-semibold">What to bring</h4>
          <div className="prose sm:prose">
            <ul className="mt-3 text-neutral-500 dark:text-neutral-400 space-y-2">
              <li>
                Formal Wear To Visit Bai Dinh Pagoda Be ready before 7.30 Am.
              </li>
              <li>We will pick up from 07.30 to 08.00 AM</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    const priceVal = Number(priceParam) || 199;
    const nights = startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 1;
    const subtotal = priceVal * nights;
    const total = subtotal;

    return (
      <div className="listingSectionSidebar__wrap shadow-xl">
        {/* PRICE */}
        <div className="flex justify-between">
          <span className="text-3xl font-semibold">
            ${priceVal}
            <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">
              /person
            </span>
          </span>
          <StartRating />
        </div>

        {/* FORM */}
        <form className="flex flex-col border border-neutral-200 dark:border-neutral-700 rounded-3xl ">
          <StayDatesRangeInput
            className="flex-1 z-[11]"
            startDate={startDate}
            endDate={endDate}
            onChangeDate={(dates) => {
              setStartDate(dates[0]);
              setEndDate(dates[1]);
            }}
          />
          <div className="w-full border-b border-neutral-200 dark:border-neutral-700"></div>
          <GuestsInput className="flex-1" />
        </form>

        {/* SUM */}
        <div className="flex flex-col space-y-4">
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

        {/* SUBMIT */}
        <ButtonPrimary href={`/checkout?title=${encodeURIComponent(titleParam)}&price=${encodeURIComponent(priceParam)}&img=${encodeURIComponent(imgParam)}&category=${encodeURIComponent(categoryParam)}&address=${encodeURIComponent(addressParam)}&checkIn=${startDate ? startDate.toISOString().split('T')[0] : ''}&checkOut=${endDate ? endDate.toISOString().split('T')[0] : ''}` as any}>Reserve</ButtonPrimary>
      </div>
    );
  };

  return (
    <div className={` nc-ListingExperiencesDetailPage `}>
      {/* SINGLE HEADER */}
      <header className="rounded-md sm:rounded-xl">
        <div className="relative grid grid-cols-4 gap-1 sm:gap-2">
          <div
            className="col-span-3 row-span-3 relative rounded-md sm:rounded-xl overflow-hidden cursor-pointer"
            onClick={handleOpenModalImageGallery}
          >
            <Image
              alt="photo 1"
              fill
              className="object-cover  rounded-md sm:rounded-xl"
              src={imgParam || PHOTOS[0]}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            />
            <div className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity"></div>
          </div>
          {PHOTOS.filter((_, i) => i >= 1 && i < 4).map((item, index) => (
            <div
              key={index}
              className={`relative rounded-md sm:rounded-xl overflow-hidden ${
                index >= 2 ? "block" : ""
              }`}
            >
              <div className="aspect-w-4 aspect-h-3">
                <Image
                  alt="photos"
                  fill
                  className="object-cover w-full h-full rounded-md sm:rounded-xl "
                  src={item || ""}
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
      <main className="relative z-10 mt-11 flex flex-col lg:flex-row ">
        {/* CONTENT */}
        <div className="w-full lg:w-3/5 xl:w-2/3 space-y-8 lg:pr-10 lg:space-y-10">
          {renderSection1()}
          {renderSection2()}
          {renderSection3()}
          <SectionDateRange />

          {renderSection5()}
          {renderSection6()}
          {renderSection7()}
          {renderSection8()}
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:block flex-grow mt-14 lg:mt-0">
          <div className="sticky top-28">{renderSidebar()}</div>
        </div>
      </main>
    </div>
  );
};

const ListingExperiencesDetailPageWrapper = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListingExperiencesDetailPage />
    </Suspense>
  );
};

export default ListingExperiencesDetailPageWrapper;
