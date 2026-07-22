"use client";

import React, { FC, ReactNode, useState, useEffect } from "react";
import { DEMO_STAY_LISTINGS } from "@/data/listings";
import { StayDataType } from "@/data/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import HeaderFilter from "./HeaderFilter";
import StayCard from "./StayCard";
import StayCard2 from "./StayCard2";
import { supabaseBrowser } from "@/lib/supabase";
import { DEMO_AUTHORS } from "@/data/authors";
import { DEMO_STAY_CATEGORIES } from "@/data/taxonomies";

export interface SectionGridFeaturePlacesProps {
  stayListings?: StayDataType[];
  gridClass?: string;
  heading?: ReactNode;
  subHeading?: ReactNode;
  headingIsCenter?: boolean;
  tabs?: string[];
  cardType?: "card1" | "card2";
}

const SectionGridFeaturePlaces: FC<SectionGridFeaturePlacesProps> = ({
  stayListings: initialStays,
  gridClass = "",
  heading = "Featured places to stay",
  subHeading = "Popular places to stay that Chisfis recommends for you",
  headingIsCenter,
  tabs = ["Tất cả", "Standard", "Deluxe", "Suite", "Family"],
  cardType = "card2",
}) => {
  const [stays, setStays] = useState<StayDataType[]>([]);
  const [activeTab, setActiveTab] = useState("Tất cả");

  useEffect(() => {
    if (initialStays && initialStays.length > 0) {
      const mappedInitial = initialStays.map((item, index) => {
        const titleLower = item.title.toLowerCase();
        let city = "Standard";
        if (titleLower.includes("family")) city = "Family";
        else if (titleLower.includes("suite")) city = "Suite";
        else if (titleLower.includes("deluxe")) city = "Deluxe";

        return { 
          ...item, 
          city,
          listingCategory: {
            ...DEMO_STAY_CATEGORIES[0],
            name: item.bedrooms === 1 ? "Phòng đơn" : "Phòng kép"
          }
        };
      });
      setStays(mappedInitial);
      return;
    }

    const fetchHomeRooms = async () => {
      try {
        const { data: dbData, error } = await supabaseBrowser
          .from("hotel_rooms")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch live rooms to get status
        let liveRooms: any[] = [];
        try {
          const roomsRes = await fetch("/api/rooms?all=true");
          if (roomsRes.ok) {
            liveRooms = await roomsRes.json();
          }
        } catch (e) {
          console.error("Failed to fetch live rooms for homepage:", e);
        }

        if (dbData && dbData.length > 0) {
          const mapped = dbData.map((h: any, index: number) => {
            const titleLower = h.title.toLowerCase();
            let city = "Standard";
            if (titleLower.includes("family")) city = "Family";
            else if (titleLower.includes("suite")) city = "Suite";
            else if (titleLower.includes("deluxe")) city = "Deluxe";

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

            const roomNumber = getRoomNumberByTitle(h.title);
            const liveRoom = (liveRooms || []).find((r: any) => r.room_number === roomNumber);
            const liveStatus = liveRoom ? liveRoom.status : "AVAILABLE";
            const liveRoomId = liveRoom ? liveRoom.id : h.id;

            return {
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
              city,
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
              listingCategory: {
                ...DEMO_STAY_CATEGORIES[0],
                name: h.beds === 1 ? "Phòng đơn" : "Phòng kép"
              },
              map: { 
                lat: 55.2094559 + (index * 0.01) - 0.03, 
                lng: 61.5594641 + (index * 0.01) - 0.03 
              },
              // Inject custom fields
              room_number: roomNumber,
              room_status: liveStatus,
              room_id: liveRoomId
            };
          });
          setStays(mapped);
        } else {
          const mappedDemo = DEMO_STAY_LISTINGS.filter((_, i) => i < 8).map((item, index) => {
            const titleLower = item.title.toLowerCase();
            let city = "Standard";
            if (titleLower.includes("family")) city = "Family";
            else if (titleLower.includes("suite")) city = "Suite";
            else if (titleLower.includes("deluxe")) city = "Deluxe";
            
            return { 
              ...item, 
              city,
              listingCategory: {
                ...DEMO_STAY_CATEGORIES[0],
                name: item.bedrooms === 1 ? "Phòng đơn" : "Phòng kép"
              }
            };
          });
          setStays(mappedDemo);
        }
      } catch (err) {
        console.warn("Could not load dynamic rooms for homepage:", err);
        const mappedDemo = DEMO_STAY_LISTINGS.filter((_, i) => i < 8).map((item, index) => {
          const titleLower = item.title.toLowerCase();
          let city = "Standard";
          if (titleLower.includes("family")) city = "Family";
          else if (titleLower.includes("suite")) city = "Suite";
          else if (titleLower.includes("deluxe")) city = "Deluxe";
          
          return { 
            ...item, 
            city,
            listingCategory: {
              ...DEMO_STAY_CATEGORIES[0],
              name: item.bedrooms === 1 ? "Phòng đơn" : "Phòng kép"
            }
          };
        });
      setStays(mappedDemo);
      }
    };
    fetchHomeRooms();
  }, [initialStays]);

  const filteredStays = stays.filter((stay) => {
    if (activeTab === "Tất cả") return true;
    return stay.city === activeTab;
  });

  const renderCard = (stay: StayDataType) => {
    let CardName = StayCard;
    switch (cardType) {
      case "card1":
        CardName = StayCard;
        break;
      case "card2":
        CardName = StayCard2;
        break;
      default:
        CardName = StayCard;
    }

    return <CardName key={stay.id} data={stay} />;
  };

  return (
    <div className="nc-SectionGridFeaturePlaces relative">
      <HeaderFilter
        tabActive={activeTab}
        subHeading={subHeading}
        tabs={tabs}
        heading={heading}
        onClickTab={(val) => setActiveTab(val)}
      />
      <div
        className={`grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gridClass}`}
      >
        {filteredStays.slice(0, 8).map((stay) => renderCard(stay))}
      </div>
      <div className="flex mt-16 justify-center items-center">
        <ButtonPrimary>Show me more</ButtonPrimary>
      </div>
    </div>
  );
};

export default SectionGridFeaturePlaces;
