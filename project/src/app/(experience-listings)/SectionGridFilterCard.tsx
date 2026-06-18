"use client";

import React, { FC, useState, useEffect } from "react";
import { DEMO_EXPERIENCES_LISTINGS } from "@/data/listings";
import { ExperiencesDataType } from "@/data/types";
import Pagination from "@/shared/Pagination";
import TabFilters from "./TabFilters";
import ExperiencesCard from "@/components/ExperiencesCard";
import HeaderFilter from "@/components/HeaderFilter";
import { supabaseBrowser } from "@/lib/supabase";
import { DEMO_AUTHORS } from "@/data/authors";
import { DEMO_EXPERIENCES_CATEGORIES } from "@/data/taxonomies";

export interface SectionGridFilterCardProps {
  className?: string;
  data?: ExperiencesDataType[];
}

const DEMO_DATA: ExperiencesDataType[] = DEMO_EXPERIENCES_LISTINGS.filter(
  (_, i) => i < 8
);

const SectionGridFilterCard: FC<SectionGridFilterCardProps> = ({
  className = "",
  data = DEMO_DATA,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [experiences, setExperiences] = useState<ExperiencesDataType[]>([]);

  useEffect(() => {
    if (data && data !== DEMO_DATA) {
      const mappedInitial = data.map((item, index) => {
        let city = "New York";
        if (index === 2 || index === 3) city = "Tokyo";
        else if (index === 4 || index === 5) city = "Paris";
        else if (index >= 6) city = "London";
        return { ...item, city };
      });
      setExperiences(mappedInitial);
      return;
    }

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
          const mappedDemo = DEMO_DATA.map((item, index) => {
            let city = "New York";
            if (index === 2 || index === 3) city = "Tokyo";
            else if (index === 4 || index === 5) city = "Paris";
            else if (index >= 6) city = "London";
            return { ...item, city };
          });
          setExperiences(mappedDemo);
        }
      } catch (err) {
        console.warn("Could not load dynamic experiences from Supabase:", err);
        const mappedDemo = DEMO_DATA.map((item, index) => {
          let city = "New York";
          if (index === 2 || index === 3) city = "Tokyo";
          else if (index === 4 || index === 5) city = "Paris";
          else if (index >= 6) city = "London";
          return { ...item, city };
        });
        setExperiences(mappedDemo);
      }
    };
    fetchExperiences();
  }, [data]);

  const filteredData = experiences.filter((item) => {
    if (activeTab === "All") return true;
    return item.city === activeTab;
  });

  return (
    <div className={`nc-SectionGridFilterCard ${className}`}>
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
      <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filteredData.map((stay) => (
          <ExperiencesCard key={stay.id} data={stay} />
        ))}
      </div>
      <div className="flex mt-16 justify-center items-center">
        <Pagination />
      </div>
    </div>
  );
};

export default SectionGridFilterCard;
