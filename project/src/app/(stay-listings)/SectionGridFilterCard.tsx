"use client";

import React, { FC, useState, useEffect } from "react";
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

        const HOTEL_IMGS = [
          "https://images.pexels.com/photos/1539777/pexels-photo-1539777.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/6238683/pexels-photo-6238683.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2029673/pexels-photo-2029673.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/4112557/pexels-photo-4112557.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/1080719/pexels-photo-1080719.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/279867/pexels-photo-279867.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/4665034/pexels-photo-4665034.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/1484981/pexels-photo-1484981.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/189333/pexels-photo-189333.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/6238614/pexels-photo-6238614.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/1652423/pexels-photo-1652423.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2736139/pexels-photo-2736139.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/3263716/pexels-photo-3263716.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/6238615/pexels-photo-6238615.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2121120/pexels-photo-2121120.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2867761/pexels-photo-2867761.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/3935330/pexels-photo-3935330.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/3316925/pexels-photo-3316925.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2029163/pexels-photo-2029163.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/3741314/pexels-photo-3741314.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/974382/pexels-photo-974382.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/6480707/pexels-photo-6480707.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/5191371/pexels-photo-5191371.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/2133230/pexels-photo-2133230.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/261146/pexels-photo-261146.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
          "https://images.pexels.com/photos/3659683/pexels-photo-3659683.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
        ];

        if (dbData && dbData.length > 0) {
          const mapped = dbData.map((h: any, index: number) => ({
            id: h.id,
            authorId: 10,
            date: "May 20, 2021",
            href: "/listing-stay-detail" as any,
            listingCategoryId: DEMO_STAY_CATEGORIES[index % 5].id,
            title: h.title,
            featuredImage: h.image_url,
            galleryImgs: [
              h.image_url,
              HOTEL_IMGS[(index * 4) % HOTEL_IMGS.length],
              HOTEL_IMGS[(index * 4 + 1) % HOTEL_IMGS.length],
              HOTEL_IMGS[(index * 4 + 2) % HOTEL_IMGS.length],
              HOTEL_IMGS[(index * 4 + 3) % HOTEL_IMGS.length]
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
            listingCategory: DEMO_STAY_CATEGORIES[index % 5],
            map: { 
              lat: 55.2094559 + (index * 0.01) - 0.03, 
              lng: 61.5594641 + (index * 0.01) - 0.03 
            }
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
    const priceNum = Number(stay.price.replace('$', '').trim());
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
          No stays match your selected filters. Please try resetting your filters.
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
