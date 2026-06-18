"use client";

import React, { FC, ReactNode, useState, useEffect } from "react";
import { DEMO_STAY_LISTINGS } from "@/data/listings";
import { StayDataType } from "@/data/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import PropertyCardH from "@/components/PropertyCardH";
import HeaderFilter from "@/components/HeaderFilter";
import { supabaseBrowser } from "@/lib/supabase";
import { DEMO_AUTHORS } from "@/data/authors";
import { DEMO_STAY_CATEGORIES } from "@/data/taxonomies";

export interface SectionGridFeaturePropertyProps {
  stayListings?: StayDataType[];
  gridClass?: string;
  heading?: ReactNode;
  subHeading?: ReactNode;
  headingIsCenter?: boolean;
  tabs?: string[];
}

const SectionGridFeatureProperty: FC<SectionGridFeaturePropertyProps> = ({
  stayListings: initialStays,
  gridClass = "",
  heading = "Featured places to stay",
  subHeading = "Popular places to stay that Chisfis recommends for you",
  headingIsCenter,
  tabs = ["New York", "Tokyo", "Paris", "London"],
}) => {
  const [stays, setStays] = useState<StayDataType[]>(initialStays || []);

  useEffect(() => {
    // Nếu có dữ liệu stays truyền trực tiếp từ props, sử dụng nó
    if (initialStays && initialStays.length > 0) {
      setStays(initialStays);
      return;
    }

    const fetchHomeRooms = async () => {
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
              "https://images.pexels.com/photos/2506988/pexels-photo-2506988.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
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
            saleOff: index === 0 ? "-10% today" : null,
            isAds: index === 0 ? true : null,
            availableRooms: h.available_rooms,
            author: DEMO_AUTHORS[0],
            listingCategory: DEMO_STAY_CATEGORIES[0],
            map: { 
              lat: 55.2094559 + (index * 0.01) - 0.03, 
              lng: 61.5594641 + (index * 0.01) - 0.03 
            }
          }));
          setStays(mapped);
        } else {
          // Fallback to static mock data if empty
          setStays(DEMO_STAY_LISTINGS.filter((_, i) => i < 8));
        }
      } catch (err) {
        console.warn("Could not load dynamic rooms for homepage:", err);
        setStays(DEMO_STAY_LISTINGS.filter((_, i) => i < 8));
      }
    };
    fetchHomeRooms();
  }, [initialStays]);

  const renderCard = (stay: StayDataType, index: number) => {
    return <PropertyCardH key={stay.id || index} className="h-full" data={stay} />;
  };

  return (
    <div className="nc-SectionGridFeatureProperty relative">
      <HeaderFilter
        tabActive={"New York"}
        subHeading={subHeading}
        tabs={tabs}
        heading={heading}
      />
      <div
        className={`grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 ${gridClass}`}
      >
        {stays.slice(0, 8).map(renderCard)}
      </div>
      <div className="flex mt-16 justify-center items-center">
        <ButtonPrimary>Show me more</ButtonPrimary>
      </div>
    </div>
  );
};

export default SectionGridFeatureProperty;
