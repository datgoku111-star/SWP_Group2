"use client";

import React, { FC, useEffect, useState } from "react";
import AnyReactComponent from "@/components/AnyReactComponent/AnyReactComponent";
import GoogleMapReact from "google-map-react";
import { DEMO_STAY_LISTINGS } from "@/data/listings";
import ButtonClose from "@/shared/ButtonClose";
import Checkbox from "@/shared/Checkbox";
import Pagination from "@/shared/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "@/shared/Heading2";
import StayCard2 from "@/components/StayCard2";
import { supabaseBrowser } from "@/lib/supabase";
import { StayDataType } from "@/data/types";
import { DEMO_AUTHORS } from "@/data/authors";
import { DEMO_STAY_CATEGORIES } from "@/data/taxonomies";

export interface SectionGridHasMapProps {}

const SectionGridHasMap: FC<SectionGridHasMapProps> = () => {
  const [currentHoverID, setCurrentHoverID] = useState<string | number>(-1);
  const [showFullMapFixed, setShowFullMapFixed] = useState(false);

  const [stayData, setStayData] = useState<StayDataType[]>(DEMO_STAY_LISTINGS);
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
            saleOff: "-10% today",
            isAds: null,
            availableRooms: h.available_rooms,
            author: DEMO_AUTHORS[0],
            listingCategory: DEMO_STAY_CATEGORIES[0],
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

  const filteredStays = stayData.filter((stay) => {
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
    <div>
      <div className="relative flex min-h-screen">
        {/* CARDSSSS */}
        <div className="min-h-screen w-full xl:w-[60%] 2xl:w-[60%] max-w-[1184px] flex-shrink-0 xl:px-8 ">
          <Heading2 className="!mb-8" />
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
          {filteredStays.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              No stays match your selected filters. Please try resetting your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 2xl:gap-x-6 gap-y-8">
              {filteredStays.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => setCurrentHoverID((_) => item.id)}
                  onMouseLeave={() => setCurrentHoverID((_) => -1)}
                >
                  <StayCard2 data={item} />
                </div>
              ))}
            </div>
          )}
          <div className="flex mt-16 justify-center items-center">
            <Pagination />
          </div>
        </div>

        {!showFullMapFixed && (
          <div
            className={`flex xl:hidden items-center justify-center fixed bottom-16 md:bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-neutral-900 text-white shadow-2xl rounded-full z-30  space-x-3 text-sm cursor-pointer`}
            onClick={() => setShowFullMapFixed(true)}
          >
            <i className="text-lg las la-map"></i>
            <span>Show map</span>
          </div>
        )}

        {/* MAPPPPP */}
        <div
          className={`xl:flex-1 xl:static xl:block ${
            showFullMapFixed ? "fixed inset-0 z-50" : "hidden"
          }`}
        >
          {showFullMapFixed && (
            <ButtonClose
              onClick={() => setShowFullMapFixed(false)}
              className="bg-white absolute z-50 left-3 top-3 shadow-lg rounded-xl w-10 h-10"
            />
          )}

          <div className="fixed xl:sticky top-0 xl:top-[88px] left-0 w-full h-full xl:h-[calc(100vh-88px)] rounded-md overflow-hidden">
            <div className="absolute bottom-5 left-3 lg:bottom-auto lg:top-2.5 lg:left-1/2 transform lg:-translate-x-1/2 py-2 px-4 bg-white dark:bg-neutral-800 shadow-xl z-10 rounded-2xl min-w-max">
              <Checkbox
                className="text-xs xl:text-sm"
                name="xx"
                label="Search as I move the map"
              />
            </div>
            <GoogleMapReact
              defaultZoom={12}
              defaultCenter={filteredStays.length > 0 ? filteredStays[0].map : (stayData[0]?.map || { lat: 55.2094559, lng: 61.5594641 })}
              bootstrapURLKeys={{
                key: "AIzaSyAGVJfZMAKYfZ71nzL_v5i3LjTTWnCYwTY",
              }}
              yesIWantToUseGoogleMapApiInternals
            >
              {filteredStays.map((item) => (
                <AnyReactComponent
                  isSelected={currentHoverID === item.id}
                  key={item.id}
                  lat={item.map.lat}
                  lng={item.map.lng}
                  listing={item}
                />
              ))}
            </GoogleMapReact>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionGridHasMap;
