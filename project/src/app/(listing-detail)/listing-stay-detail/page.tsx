"use client";

import React, { FC, Fragment, useState, useEffect, Suspense, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
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
import ButtonClose from "@/shared/ButtonClose";
import Input from "@/shared/Input";
import LikeSaveBtns from "@/components/LikeSaveBtns";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Amenities_demos, PHOTOS } from "./constant";
import StayDatesRangeInput from "./StayDatesRangeInput";
import GuestsInput from "./GuestsInput";
import SectionDateRange from "../SectionDateRange";
import { Route } from "next";
import { supabaseBrowser } from "@/lib/supabase";
import { GuestsObject } from "../../(client-components)/type";

export interface ListingStayDetailPageProps {}

const ListingStayDetailPage: FC<ListingStayDetailPageProps> = ({}) => {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const titleParam = searchParams.get("title") || "Beach House in Collingwood";
  const priceParam = searchParams.get("price") || "119";
  const imgParam = searchParams.get("img") || "";
  const categoryParam = searchParams.get("category") || "Wooden house";
  const addressParam = searchParams.get("address") || "Tokyo, Jappan";
  const bedsParam = searchParams.get("beds") || "6";
  const galleryParam = searchParams.get("gallery")?.split(",") || PHOTOS;

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
  const [guests, setGuests] = useState<GuestsObject>({
    guestAdults: 2,
    guestChildren: 1,
    guestInfants: 1,
  });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [hotelRoomData, setHotelRoomData] = useState<any>(null);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [liveRoom, setLiveRoom] = useState<any>(null);

  const targetCategory = useMemo(() => {
    const t = titleParam.toLowerCase();
    if (t.includes("suite")) return "Suite";
    if (t.includes("deluxe")) return "Deluxe";
    if (t.includes("family")) return "Family";
    return "Standard";
  }, [titleParam]);

  const allRoomsOfCategory = useMemo(() => {
    return occupancyData.filter((r) => r.room_type?.toLowerCase() === targetCategory.toLowerCase());
  }, [occupancyData, targetCategory]);

  const selectedRoomData = useMemo(() => {
    return availableRooms.find(r => r.id === selectedRoomId) || null;
  }, [availableRooms, selectedRoomId]);

  // 1. Fetch static hotel product data (available_rooms capacity) from DB
  useEffect(() => {
    const fetchHotelRoom = async () => {
      try {
        const { data, error } = await supabaseBrowser
          .from("hotel_rooms")
          .select("*")
          .eq("title", titleParam)
          .single();
        if (data) {
          setHotelRoomData(data);
        }
      } catch (err) {
        console.error("Failed to fetch hotel room info:", err);
      }
    };
    fetchHotelRoom();
  }, [titleParam]);

  // 2. Fetch occupancy calendar for all rooms
  const fetchOccupancyData = async () => {
    try {
      const res = await fetch("/api/rooms/occupancy");
      if (res.ok) {
        const data = await res.json();
        setOccupancyData(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch room occupancy:", err);
    }
  };

  useEffect(() => {
    fetchOccupancyData();
  }, []);

  // 2.5 Fetch specific live room info matching the title
  useEffect(() => {
    const fetchLiveRoom = async () => {
      try {
        const res = await fetch("/api/rooms?all=true");
        if (res.ok) {
          const rooms = await res.json();
          const getRoomNumberByTitle = (title: string): string => {
            const t = title.toLowerCase();
            if (t.includes("cedars")) return "101";
            if (t.includes("ship & castle") || t.includes("ship and castle")) return "102";
            if (t.includes("bell")) return "103";
            if (t.includes("windmill")) return "201";
            if (t.includes("holiday inn")) return "202";
            if (t.includes("half moon")) return "203";
            if (t.includes("white horse")) return "301";
            if (t.includes("unicorn")) return "302";
            return "101";
          };
          const num = getRoomNumberByTitle(titleParam);
          const found = (rooms || []).find((r: any) => r.room_number === num);
          if (found) {
            setLiveRoom(found);
          }
        }
      } catch (err) {
        console.error("Failed to load live room info for detail page:", err);
      }
    };
    fetchLiveRoom();

    const channel = supabaseBrowser
      .channel("live_rooms_detail")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        (payload) => {
          console.log("Realtime room change on detail page:", payload);
          fetchLiveRoom();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [titleParam]);
  // 3. Check live rooms available for selected dates
  useEffect(() => {
    if (!startDate || !endDate) return;
    const checkInStr = startDate.toISOString().split("T")[0];
    const checkOutStr = endDate.toISOString().split("T")[0];

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const res = await fetch(`/api/rooms?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
        if (res.ok) {
          const data = await res.json();
          
          const filtered = (data || []).filter((r: any) => 
            r.room_type?.name?.toLowerCase() === targetCategory.toLowerCase()
          );
          
          const roomsToUse = filtered.length > 0 ? filtered : (data || []);
          setAvailableRooms(roomsToUse);

          if (roomsToUse && roomsToUse.length > 0) {
            // Keep selected room if it is still available, otherwise default to first available
            setSelectedRoomId((prevId) => {
              const stillAvailable = roomsToUse.some((r: any) => r.id === prevId);
              return stillAvailable ? prevId : roomsToUse[0].id;
            });
          } else {
            setSelectedRoomId("");
          }
        }
        // Refresh occupancy calendar too
        fetchOccupancyData();
      } catch (err) {
        console.error("Failed to check room availability:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [startDate, endDate]);

  let [isOpenModalAmenities, setIsOpenModalAmenities] = useState(false);

  const thisPathname = usePathname();
  const router = useRouter();

  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hotelLocation, setHotelLocation] = useState<string>("");
  const [hotelMapUrl, setHotelMapUrl] = useState<string>("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(
          `/api/feedbacks?title=${encodeURIComponent(titleParam)}`,
        );
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

  useEffect(() => {
    let isMounted = true;

    const fetchHotelLocation = async () => {
      try {
        let query = supabaseBrowser.from("hotel_rooms").select("title, location, google_map_url");

        if (titleParam) {
          query = query.ilike("title", `%${titleParam}%`);
        } else if (addressParam) {
          query = query.ilike("location", `%${addressParam}%`);
        }

        const { data, error } = await query.limit(1);

        if (error) throw error;

        if (!isMounted || !data?.[0]) return;

        const matchedHotel = data[0] as { title?: string; location?: string; google_map_url?: string | null };
        const nextLocation = matchedHotel.location || matchedHotel.title || "";
        const nextMapUrl = matchedHotel.google_map_url || "";

        setHotelLocation(nextLocation);
        setHotelMapUrl(nextMapUrl);
      } catch (err) {
        console.warn("Could not load hotel location from Supabase, using fallback values:", err);
      }
    };

    fetchHotelLocation();

    return () => {
      isMounted = false;
    };
  }, [titleParam, addressParam]);

  const excludeDateIntervals = useMemo(() => {
    if (!selectedRoomData || !occupancyData) return [];
    const roomOcc = occupancyData.find((r) => r.id === selectedRoomData.id);
    if (!roomOcc || !roomOcc.bookedRanges) return [];
    return roomOcc.bookedRanges.map((range: any) => ({
      start: new Date(range.checkIn),
      end: new Date(range.checkOut),
    }));
  }, [selectedRoomData, occupancyData]);

  const displayAddress = useMemo(() => {
    return hotelLocation || addressParam || "Tokyo, Japan";
  }, [hotelLocation, addressParam]);

  const mapQuery = useMemo(() => {
    const rawQuery = hotelMapUrl || displayAddress || `${titleParam} ${addressParam}`;
    return rawQuery.trim() || "Tokyo, Japan";
  }, [hotelMapUrl, displayAddress, titleParam, addressParam]);

  const mapEmbedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  }, [mapQuery]);

  const handleSubmitFeedback = async () => {
    if (!user) {
      alert(t("listingDetailLoginToComment"));
      return;
    }
    if (!commentInput.trim()) {
      alert(t("listingDetailCommentRequired"));
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
        throw new Error(errData.error || t("listingDetailCommentSubmitError"));
      }

      const newFeedback = await res.json();
      setFeedbacks((prev) => [newFeedback, ...prev]);
      setCommentInput("");
    } catch (err: any) {
      alert(err.message || t("listingDetailCommentGeneralError"));
    } finally {
      setSubmitLoading(false);
    }
  };

  function closeModalAmenities() {
    setIsOpenModalAmenities(false);
  }

  function openModalAmenities() {
    setIsOpenModalAmenities(true);
  }

  const handleOpenModalImageGallery = () => {
    router.push(`${thisPathname}/?modal=PHOTO_TOUR_SCROLLABLE` as Route);
  };

  const renderSection1 = () => {
    return (
      <div className="listingSection__wrap !space-y-6">
        {/* 1 */}
        <div className="flex justify-between items-center">
          <Badge name={categoryParam} />
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
            <span className="ml-1"> {displayAddress}</span>
          </span>
        </div>

        {/* 4 */}
        <div className="flex items-center">
          <Avatar hasChecked sizeClass="h-10 w-10" radius="rounded-full" />
          <span className="ml-2.5 text-neutral-500 dark:text-neutral-400">
            {t("listingDetailHostedBy")}{" "}
            <span className="text-neutral-900 dark:text-neutral-200 font-medium">
              Kevin Francis
            </span>
          </span>
        </div>

        {/* 5 */}
        <div className="w-full border-b border-neutral-100 dark:border-neutral-700" />

        {/* 6 */}
        <div className="flex items-center justify-between xl:justify-start space-x-8 xl:space-x-12 text-sm text-neutral-700 dark:text-neutral-300">
          <div className="flex items-center space-x-3">
            <i className=" las la-door-closed text-2xl"></i>
            <span className=" ">
              <span className="hidden sm:inline-block">{categoryParam}</span>
              <span className="sm:hidden">{categoryParam}</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <i className=" las la-bath text-2xl"></i>
            <span className=" ">
              3{" "}
              <span className="hidden sm:inline-block">
                {t("listingDetailBaths")}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <i className=" las la-door-open text-2xl"></i>
            <span className=" ">
              2{" "}
              <span className="hidden sm:inline-block">
                {t("listingDetailBedrooms")}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getStayDescription = () => {
    const p1 = `Welcome to ${titleParam}, a delightful ${categoryParam.toLowerCase()} nestled in ${addressParam}. Offering a harmonious blend of modern convenience and local charm, this property provides the perfect escape. Experience excellent amenities and warm hospitality starting from $${priceParam} per night.`;

    const p2 = `This well-appointed space accommodates guests comfortably with its ${bedsParam} beds, making it ideal for both short getaways and extended stays. Each unit is equipped with a private bathroom, clean linens, a hairdryer, and complimentary toiletries to ensure a seamless and restful stay.`;

    const p3 = `Guests at ${titleParam} can enjoy access to unique property highlights such as a scenic terrace, a cozy shared lounge, and a tranquil garden area. Conveniently located near local attractions, it serves as the perfect base for exploring the rich culture and activities nearby.`;

    return { p1, p2, p3 };
  };

  const renderSection2 = () => {
    const { p1, p2, p3 } = getStayDescription();
    return (
      <div className="listingSection__wrap">
        <h2 className="text-2xl font-semibold">
          {t("listingDetailStayInformation")}
        </h2>
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
          <h2 className="text-2xl font-semibold">
            {t("listingDetailAmenities")}
          </h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            {t("listingDetailAmenitiesSubtitle")}
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* 6 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-sm text-neutral-700 dark:text-neutral-300 ">
          {Amenities_demos.filter((_, i) => i < 12).map((item) => (
            <div key={item.name} className="flex items-center space-x-3">
              <i className={`text-3xl las ${item.icon}`}></i>
              <span className=" ">{item.name}</span>
            </div>
          ))}
        </div>

        {/* ----- */}
        <div className="w-14 border-b border-neutral-200"></div>
        <div>
          <ButtonSecondary onClick={openModalAmenities}>
            {t("listingDetailViewMoreAmenities")}
          </ButtonSecondary>
        </div>
        {renderMotalAmenities()}
      </div>
    );
  };

  const renderMotalAmenities = () => {
    return (
      <Transition appear show={isOpenModalAmenities} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={closeModalAmenities}
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
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-40" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
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
              <div className="inline-block py-8 h-screen w-full max-w-4xl">
                <div className="inline-flex pb-2 flex-col w-full text-left align-middle transition-all transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 dark:border dark:border-neutral-700 dark:text-neutral-100 shadow-xl h-full">
                  <div className="relative flex-shrink-0 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 text-center">
                    <h3
                      className="text-lg font-medium leading-6 text-gray-900"
                      id="headlessui-dialog-title-70"
                    >
                      Amenities
                    </h3>
                    <span className="absolute left-3 top-3">
                      <ButtonClose onClick={closeModalAmenities} />
                    </span>
                  </div>
                  <div className="px-8 overflow-auto text-neutral-700 dark:text-neutral-300 divide-y divide-neutral-200">
                    {Amenities_demos.filter((_, i) => i < 1212).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center py-2.5 sm:py-4 lg:py-5 space-x-5 lg:space-x-8"
                      >
                        <i
                          className={`text-4xl text-neutral-6000 las ${item.icon}`}
                        ></i>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    );
  };

  const renderSection4 = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <div>
          <h2 className="text-2xl font-semibold">Room Rates </h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            Prices may increase on weekends or holidays
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* CONTENT */}
        <div className="flow-root">
          <div className="text-sm sm:text-base text-neutral-6000 dark:text-neutral-300 -mb-4">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 flex justify-between items-center space-x-4 rounded-lg">
              <span>Monday - Thursday</span>
              <span>$199</span>
            </div>
            <div className="p-4  flex justify-between items-center space-x-4 rounded-lg">
              <span>Monday - Thursday</span>
              <span>$199</span>
            </div>
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 flex justify-between items-center space-x-4 rounded-lg">
              <span>Friday - Sunday</span>
              <span>$219</span>
            </div>
            <div className="p-4 flex justify-between items-center space-x-4 rounded-lg">
              <span>Rent by month</span>
              <span>-8.34 %</span>
            </div>
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 flex justify-between items-center space-x-4 rounded-lg">
              <span>Minimum number of nights</span>
              <span>1 night</span>
            </div>
            <div className="p-4 flex justify-between items-center space-x-4 rounded-lg">
              <span>Max number of nights</span>
              <span>90 nights</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionOccupancySchedule = () => {
    return (
      <div className="listingSection__wrap !space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Availability & Schedule</h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            View the detailed list of rooms and upcoming booked periods to easily plan your stay
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />
        
        <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-left text-sm text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">ROOM / FLOOR</th>
                <th scope="col" className="px-6 py-4">ROOM TYPE</th>
                <th scope="col" className="px-6 py-4">TODAY</th>
                <th scope="col" className="px-6 py-4">UPCOMING BOOKINGS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900/40">
              {occupancyData.length > 0 ? (
                occupancyData
                  .filter((room) => room.room_type?.toLowerCase() === targetCategory.toLowerCase())
                  .map((room) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOccupiedToday = room.bookedRanges?.some((b: any) => {
                    return todayStr >= b.checkIn && todayStr < b.checkOut;
                  });

                  return (
                    <tr key={room.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900 dark:text-neutral-100">
                        <span className="font-bold text-neutral-900 dark:text-white">Room {room.room_number}</span> <span className="text-xs text-neutral-400">(Floor {room.floor})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                          {room.room_type || "Standard"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          if (room.status === 'CLEANING') {
                            return (
                              <span className="inline-flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 mr-1.5 animate-pulse"></span>
                                CLEANING
                              </span>
                            );
                          }
                          if (room.status === 'DIRTY') {
                            return (
                              <span className="inline-flex items-center text-xs font-semibold text-red-600 dark:text-red-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 mr-1.5 animate-pulse"></span>
                                DIRTY
                              </span>
                            );
                          }
                          if (room.status === 'MAINTENANCE') {
                            return (
                              <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mr-1.5"></span>
                                MAINTENANCE
                              </span>
                            );
                          }
                          if (isOccupiedToday) {
                            return (
                              <span className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mr-1.5 animate-pulse"></span>
                                IN_USE
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-1.5"></span>
                              AVAILABLE
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {room.bookedRanges && room.bookedRanges.length > 0 ? (
                            room.bookedRanges.map((b: any, idx: number) => {
                              const checkInFormatted = new Date(b.checkIn).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit"
                              });
                              const checkOutFormatted = new Date(b.checkOut).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit"
                              });
                              return (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-2.5 py-1 m-1 rounded-lg text-xs font-mono font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 shadow-sm"
                                >
                                  {checkInFormatted} → {checkOutFormatted}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                              ✓ Available (No upcoming bookings)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    Loading room schedule...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        <h2 className="text-2xl font-semibold">
          Reviews ({feedbacks.length} reviews)
        </h2>
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
              placeholder={
                user
                  ? "Share your thoughts ..."
                  : "Đăng nhập để viết đánh giá..."
              }
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
                  name:
                    item.user?.full_name ||
                    item.user?.email?.split("@")[0] ||
                    "Người dùng",
                  avatar: "",
                  date: new Date(item.created_at).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                  comment: item.comment,
                  starPoint: item.rating,
                }}
              />
            ))
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 py-8 text-sm">
              Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nghĩ của
              bạn!
            </p>
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
            {displayAddress}
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
              src={mapEmbedUrl}
              title={`Map for ${titleParam}`}
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
            Refund 50% of the booking value when customers cancel the room
            within 48 hours after successful booking and 14 days before the
            check-in time. <br />
            Then, cancel the room 14 days before the check-in time, get a 50%
            refund of the total amount paid (minus the service fee).
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* CONTENT */}
        <div>
          <h4 className="text-lg font-semibold">Check-in time</h4>
          <div className="mt-3 text-neutral-500 dark:text-neutral-400 max-w-md text-sm sm:text-base">
            <div className="flex space-x-10 justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <span>Check-in</span>
              <span>08:00 am - 12:00 am</span>
            </div>
            <div className="flex space-x-10 justify-between p-3">
              <span>Check-out</span>
              <span>02:00 pm - 04:00 pm</span>
            </div>
          </div>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700" />

        {/* CONTENT */}
        <div>
          <h4 className="text-lg font-semibold">Special Note</h4>
          <div className="prose sm:prose">
            <ul className="mt-3 text-neutral-500 dark:text-neutral-400 space-y-2">
              <li>
                Ban and I will work together to keep the landscape and
                environment green and clean by not littering, not using
                stimulants and respecting people around.
              </li>
              <li>Do not sing karaoke past 11:30</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    const priceVal = Number(priceParam) || 119;
    const nights =
      startDate && endDate
        ? Math.max(
            1,
            Math.ceil(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : 1;
    const subtotal = priceVal * nights;
    const total = subtotal;

    return (
      <div className="listingSectionSidebar__wrap shadow-xl">
        {/* PRICE */}
        <div className="flex justify-between">
          <span className="text-3xl font-semibold">
            {formatPrice(priceVal, "USD")}
            <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">
              /night
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
            minDate={new Date()}
            excludeDateIntervals={excludeDateIntervals}
          />
          <div className="w-full border-b border-neutral-200 dark:border-neutral-700"></div>
          <GuestsInput className="flex-1" defaultValue={guests} onChange={(val) => setGuests(val)} />
        </form>

        {/* SUM */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
            <span>{formatPrice(priceVal, "USD")} x {nights} night{nights > 1 ? "s" : ""}</span>
            <span>{formatPrice(subtotal, "USD")}</span>
          </div>
          <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
            <span>Service charge</span>
            <span>{formatPrice(0, "USD")}</span>
          </div>
          <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(total, "USD")}</span>
          </div>
        </div>

        {/* AVAILABILITY INFO */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2.5 text-sm">
          {checkingAvailability ? (
            <div className="flex items-center justify-center space-x-2 py-1 text-neutral-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-6000 border-t-transparent"></div>
              <span>Checking availability...</span>
            </div>
          ) : (() => {
            const maxAvailable = hotelRoomData ? Math.min(hotelRoomData.available_rooms, availableRooms.length) : availableRooms.length;
            return (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-green-600 font-semibold">
                  <span>✓ Available</span>
                  <span className="bg-green-50 dark:bg-green-900/20 text-xs px-2.5 py-1 rounded-lg">
                    {maxAvailable} rooms ready
                  </span>
                </div>

                {allRoomsOfCategory.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2 mt-2">
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      Please select a room:
                    </span>
                    <div className="max-h-72 overflow-y-auto overscroll-contain space-y-2 pr-2">
                      {allRoomsOfCategory.map((room) => {
                        const isAvailable = availableRooms.some(ar => ar.id === room.id);
                        const isUnavailableForDates = !isAvailable && startDate && endDate;
                        return (
                          <label
                            key={room.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer border transition-all ${
                              selectedRoomId === room.id
                                ? "border-primary-6000 bg-primary-50 dark:bg-primary-900/10"
                                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            } ${isUnavailableForDates ? "opacity-60 bg-neutral-100 dark:bg-neutral-900" : ""}`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="selectedRoom"
                                className="text-primary-6000 focus:ring-primary-6000"
                                checked={selectedRoomId === room.id}
                                onChange={() => setSelectedRoomId(room.id)}
                              />
                              <div className="text-sm">
                                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  Room {room.room_number} (Floor {room.floor})
                                  {isUnavailableForDates && (
                                    <span className="ml-2 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                      Fully booked
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {room.notes === 'SINGLE' ? 'Single' : 'Double'} - Status: {
                                    room.status === 'AVAILABLE' ? 'AVAILABLE' :
                                    room.status === 'IN_USE' ? 'IN_USE' :
                                    room.status === 'DIRTY' ? 'DIRTY' :
                                    room.status === 'CLEANING' ? 'CLEANING' :
                                    room.status === 'MAINTENANCE' ? 'MAINTENANCE' : room.status
                                  }
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* SUBMIT */}
        {(() => {
          if (!startDate || !endDate) {
            return (
              <button 
                type="button" 
                disabled 
                className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 rounded-3xl font-semibold cursor-not-allowed text-center text-sm"
              >
                Please select check-in/check-out dates
              </button>
            );
          }

          if (!selectedRoomId) {
            return (
              <button 
                type="button" 
                disabled 
                className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 rounded-3xl font-semibold cursor-not-allowed text-center text-sm"
              >
                Please select a room
              </button>
            );
          }

          // Check if selected room is actually available
          const isAvailable = availableRooms.some(r => r.id === selectedRoomId);
          if (!isAvailable) {
            return (
              <button 
                type="button" 
                disabled 
                className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-3xl font-semibold cursor-not-allowed text-center text-sm"
              >
                Room is fully booked for the selected dates
              </button>
            );
          }

          return (
            <ButtonPrimary href={`/checkout?title=${encodeURIComponent(titleParam)}&price=${encodeURIComponent(priceParam)}&img=${encodeURIComponent(imgParam)}&category=${encodeURIComponent(categoryParam)}&address=${encodeURIComponent(addressParam)}&beds=${bedsParam}&checkIn=${startDate.toISOString().split('T')[0]}&checkOut=${endDate.toISOString().split('T')[0]}&adults=${guests.guestAdults}&children=${guests.guestChildren}&infants=${guests.guestInfants}&roomId=${selectedRoomId}` as any}>
              Reserve
            </ButtonPrimary>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="nc-ListingStayDetailPage">
      {/*  HEADER */}
      <header className="rounded-md sm:rounded-xl">
        <div className="relative grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
          <div
            className="col-span-2 row-span-3 sm:row-span-2 relative rounded-md sm:rounded-xl overflow-hidden cursor-pointer"
            onClick={handleOpenModalImageGallery}
          >
            <Image
              fill
              className="object-cover rounded-md sm:rounded-xl"
              src={imgParam || galleryParam[0]}
              alt=""
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            />
            <div className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity"></div>
          </div>
          {galleryParam.filter((_, i) => i >= 1 && i < 5).map((item, index) => (
            <div
              key={index}
              className={`relative rounded-md sm:rounded-xl overflow-hidden ${
                index >= 3 ? "hidden sm:block" : ""
              }`}
            >
              <div className="aspect-w-4 aspect-h-3 sm:aspect-w-6 sm:aspect-h-5">
                <Image
                  fill
                  className="object-cover rounded-md sm:rounded-xl "
                  src={item || ""}
                  alt=""
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

          <button
            className="absolute hidden md:flex md:items-center md:justify-center left-3 bottom-3 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 z-10"
            onClick={handleOpenModalImageGallery}
          >
            <Squares2X2Icon className="w-5 h-5" />
            <span className="ml-2 text-neutral-800 text-sm font-medium">
              Show all photos
            </span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className=" relative z-10 mt-11 flex flex-col lg:flex-row ">
        {/* CONTENT */}
        <div className="w-full lg:w-3/5 xl:w-2/3 space-y-8 lg:space-y-10 lg:pr-10">
          {renderSection1()}
          {renderSection2()}
          {renderSection3()}
          {renderSection4()}
          {renderSectionOccupancySchedule()}
          <SectionDateRange excludeDateIntervals={excludeDateIntervals} />
          {renderSection5()}
          {renderSection6()}
          {renderSection7()}
          {renderSection8()}
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:block flex-grow mt-14 lg:mt-0">
          <div className="sticky top-28 pb-10">{renderSidebar()}</div>
        </div>
      </main>
    </div>
  );
};

const ListingStayDetailPageWrapper = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListingStayDetailPage />
    </Suspense>
  );
};

export default ListingStayDetailPageWrapper;
