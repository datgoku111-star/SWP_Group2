"use client";

import React, { FC, useState, useEffect } from "react";
import AnyReactComponent from "@/components/AnyReactComponent/AnyReactComponent";
import GoogleMapReact from "google-map-react";
import { DEMO_EXPERIENCES_LISTINGS } from "@/data/listings";
import ButtonClose from "@/shared/ButtonClose";
import Checkbox from "@/shared/Checkbox";
import Pagination from "@/shared/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "@/shared/Heading2";
import ExperiencesCardH from "@/components/ExperiencesCardH";
import HeaderFilter from "@/components/HeaderFilter";
import { supabaseBrowser } from "@/lib/supabase";
import { DEMO_AUTHORS } from "@/data/authors";
import { DEMO_EXPERIENCES_CATEGORIES } from "@/data/taxonomies";

export interface SectionGridHasMapProps {}

const SectionGridHasMap: FC<SectionGridHasMapProps> = () => {
  const [currentHoverID, setCurrentHoverID] = useState<string | number>(-1);
  const [showFullMapFixed, setShowFullMapFixed] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const { data: dbData, error } = await supabaseBrowser
          .from("experiences")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (dbData && dbData.length > 0) {
          const mapped = dbData.map((exp: any, index: number) => ({
            id: exp.id,
            authorId: 10,
            date: "May 20, 2021",
            href: "/listing-experiences-detail" as any,
            listingCategoryId: 17,
            title: exp.title,
            featuredImage: exp.image_url,
            galleryImgs: [
              exp.image_url,
              "https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
            ],
            commentCount: 70,
            viewCount: 602,
            like: false,
            address: exp.location,
            city: exp.city,
            reviewStart: exp.rating,
            reviewCount: exp.review_count || 28,
            price: `$${exp.price}`,
            maxGuests: exp.guests,
            isAds: null,
            saleOff: null,
            author: DEMO_AUTHORS[0],
            listingCategory: DEMO_EXPERIENCES_CATEGORIES[0],
            map: { 
              lat: 55.2094559 + (index * 0.01) - 0.03, 
              lng: 61.5594641 + (index * 0.01) - 0.03 
            }
          }));
          setExperiences(mapped);
        } else {
          const mappedDemo = DEMO_EXPERIENCES_LISTINGS.filter((_, i) => i < 12).map((item, index) => {
            let city = "New York";
            if (index === 2 || index === 3 || index === 8 || index === 9) city = "Tokyo";
            else if (index === 4 || index === 5 || index === 10) city = "Paris";
            else if (index >= 6) city = "London";
            return { ...item, city };
          });
          setExperiences(mappedDemo);
        }
      } catch (err) {
        console.warn("Could not load dynamic experiences from Supabase:", err);
        const mappedDemo = DEMO_EXPERIENCES_LISTINGS.filter((_, i) => i < 12).map((item, index) => {
          let city = "New York";
          if (index === 2 || index === 3 || index === 8 || index === 9) city = "Tokyo";
          else if (index === 4 || index === 5 || index === 10) city = "Paris";
          else if (index >= 6) city = "London";
          return { ...item, city };
        });
        setExperiences(mappedDemo);
      }
    };
    fetchExperiences();
  }, []);

  const filteredExperiences = experiences.filter((item) => {
    if (activeTab === "All") return true;
    return item.city === activeTab;
  });

  return (
    <div>
      <div className="relative flex min-h-screen">
        {/* CARDSSSS */}
        <div className="min-h-screen w-full xl:w-[780px] 2xl:w-[880px] flex-shrink-0 xl:px-8 ">
          <HeaderFilter
            tabActive={activeTab}
            heading="Experiences"
            subHeading={
              <span className="block text-neutral-500 dark:text-neutral-400 mt-3">
                233 experiences
                <span className="mx-2">·</span>
                Aug 12 - 18
                <span className="mx-2">·</span>2 Guests
              </span>
            }
            tabs={["All", "New York", "Tokyo", "Paris", "London"]}
            onClickTab={(val) => setActiveTab(val)}
          />
          <div className="mb-8 lg:mb-11">
            <TabFilters />
          </div>
          <div className="grid grid-cols-1 gap-8">
            {filteredExperiences.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setCurrentHoverID((_) => item.id)}
                onMouseLeave={() => setCurrentHoverID((_) => -1)}
              >
                <ExperiencesCardH data={item} />
              </div>
            ))}
          </div>
          <div className="flex mt-16 justify-center items-center">
            <Pagination />
          </div>
        </div>

        <div
          className="flex xl:hidden items-center justify-center fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-neutral-900 text-white shadow-2xl rounded-full z-30  space-x-3 text-sm cursor-pointer"
          onClick={() => setShowFullMapFixed(true)}
        >
          <i className="text-lg las la-map"></i>
          <span>Show map</span>
        </div>

        {/* MAPPPPP */}
        <div
          className={`xl:flex-grow xl:static xl:block ${
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
            <div className="absolute bottom-5 left-3 lg:bottom-auto lg:top-2.5 lg:left-1/2 transform lg:-translate-x-1/2 py-2 px-4 bg-white shadow-xl z-10 rounded-2xl min-w-max">
              <Checkbox
                className="text-xs xl:text-sm text-neutral-800"
                name="xx"
                label="Search as I move the map"
              />
            </div>
            {/* BELLOW IS MY GOOGLE API KEY -- PLEASE DELETE AND TYPE YOUR API KEY */}

            <GoogleMapReact
              bootstrapURLKeys={{
                key: "AIzaSyAGVJfZMAKYfZ71nzL_v5i3LjTTWnCYwTY",
              }}
              yesIWantToUseGoogleMapApiInternals
              defaultZoom={12}
              defaultCenter={filteredExperiences.length > 0 ? filteredExperiences[0].map : (experiences[0]?.map || { lat: 55.2094559, lng: 61.5594641 })}
            >
              {filteredExperiences.map((item) => (
                <AnyReactComponent
                  isSelected={currentHoverID === item.id}
                  key={item.id}
                  lat={item.map.lat}
                  lng={item.map.lng}
                  experiences={item}
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
