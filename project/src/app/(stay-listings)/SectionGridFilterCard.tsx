"use client";

import React, { FC, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DEMO_STAY_LISTINGS } from "@/data/listings";
import { StayDataType } from "@/data/types";
import Pagination from "@/shared/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "@/shared/Heading2";
import StayCard2 from "@/components/StayCard2";
import { supabaseBrowser } from "@/lib/supabase";
import { DEMO_AUTHORS } from "@/data/authors";
import { DEMO_STAY_CATEGORIES } from "@/data/taxonomies";

export interface SectionGridFilterCardProps {
  className?: string;
  data?: StayDataType[];
}

const SectionGridFilterCard: FC<SectionGridFilterCardProps> = ({
  className = "",
  data = DEMO_STAY_LISTINGS,
}) => {
  const { t } = useTranslation();
  const [stayData, setStayData] = useState<StayDataType[]>(data);
  const [typeOfPlace, setTypeOfPlace] = useState<string[]>([]);
  const [rangePrices, setRangePrices] = useState<number[]>([0, 1000]);
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const { data: dbData, error } = await supabaseBrowser
          .from("hotel_rooms")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (dbData && dbData.length > 0) {
          const mapped = dbData.map((h: any, index: number) => ({
            id: h.id,
            authorId: 10,
            date: "May 20, 2021",
            href: "/listing-stay-detail" as any,
            listingCategoryId: 17,
            title: h.title,
            featuredImage: h.image_url,
            galleryImgs: [
              h.image_url,
              "https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
              "https://images.pexels.com/photos/1179156/pexels-photo-1179156.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
              "https://images.pexels.com/photos/2506988/pexels-photo-2506988.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
            ],
            commentCount: 70,
            viewCount: 602,
            like: false,
            address: h.location,
            reviewStart: h.rating,
            reviewCount: 28,
            price: `$${h.price_per_night}`,
            maxGuests: h.guests,
            bedrooms: h.beds,
            bathrooms: 3,
            saleOff: "-10% today",
            isAds: null,
            availableRooms: h.available_rooms,
            author: DEMO_AUTHORS[0],
            listingCategory: DEMO_STAY_CATEGORIES[0],
            map: {
              lat: 55.2094559 + index * 0.01 - 0.03,
              lng: 61.5594641 + index * 0.01 - 0.03,
            },
          }));
          setStayData(mapped);
        }
      } catch (err) {
        console.warn("Could not load dynamic hotel_rooms from Supabase:", err);
      }
    };
    fetchHotels();
  }, []);

  const filteredData = stayData.filter((stay) => {
    // 1. Price
    const priceNum = Number(stay.price.replace("$", "").trim());
    if (priceNum < rangePrices[0] || priceNum > rangePrices[1]) {
      return false;
    }

    // 2. Location
    if (location.trim() !== "") {
      const address = stay.address || "";
      if (!address.toLowerCase().includes(location.toLowerCase().trim())) {
        return false;
      }
    }

    // 5. Type of place
    if (typeOfPlace.length > 0) {
      const categoryName = stay.listingCategory?.name || "";
      const isMatch = typeOfPlace.some((t) => {
        if (t === "Entire place" && categoryName === "Entire cabin") {
          return true;
        }
        return categoryName.toLowerCase().includes(t.toLowerCase());
      });
      if (!isMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <div
      className={`nc-SectionGridFilterCard ${className}`}
      data-nc-id="SectionGridFilterCard"
    >
      <Heading2 />

      <div className="mb-8 lg:mb-11">
        <TabFilters
          typeOfPlace={typeOfPlace}
          setTypeOfPlace={setTypeOfPlace}
          rangePrices={rangePrices}
          setRangePrices={setRangePrices}
          location={location}
          setLocation={setLocation}
        />
      </div>
      {filteredData.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          {t("listingNoStaysMatch")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((stay) => (
            <StayCard2 key={stay.id} data={stay} />
          ))}
        </div>
      )}
      <div className="flex mt-16 justify-center items-center">
        <Pagination />
      </div>
    </div>
  );
};

export default SectionGridFilterCard;
