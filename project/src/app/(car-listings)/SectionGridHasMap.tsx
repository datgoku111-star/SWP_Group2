"use client";

import React, { FC, useState } from "react";
import GoogleMapReact from "google-map-react";
import { DEMO_CAR_LISTINGS } from "@/data/listings";
import ButtonClose from "@/shared/ButtonClose";
import Checkbox from "@/shared/Checkbox";
import Pagination from "@/shared/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "@/shared/Heading2";
import CarCardH from "@/components/CarCardH";
import AnyReactComponent from "@/components/AnyReactComponent/AnyReactComponent";

// carTypes and getCarType removed because we now use data.type directly

export interface SectionGridHasMapProps {}

const SectionGridHasMap: FC<SectionGridHasMapProps> = () => {
  const [currentHoverID, setCurrentHoverID] = useState<string | number>(-1);
  const [showFullMapFixed, setShowFullMapFixed] = useState(false);
  const [rangePrices, setRangePrices] = useState<number[]>([0, 1000]);
  const [typeOfCarSelected, setTypeOfCarSelected] = useState<string[]>([]);

  const filteredCars = DEMO_CAR_LISTINGS.filter((car) => {
    // 1. Price filter
    const priceNum = Number(car.price.replace(/[^0-9]/g, "")) || 0;
    if (priceNum < rangePrices[0] || priceNum > rangePrices[1]) {
      return false;
    }

    // 2. Car Type filter
    if (typeOfCarSelected.length > 0) {
      const carType = car.type || "";
      if (!typeOfCarSelected.includes(carType)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div>
      <div className="relative flex min-h-screen">
        {/* CARDSSSS */}
        <div className="min-h-screen w-full xl:w-[780px] 2xl:w-[880px] flex-shrink-0 xl:px-8 ">
          <Heading2
            heading="Cars in Tokyo"
            subHeading={
              <span className="block text-neutral-500 dark:text-neutral-400 mt-3">
                {filteredCars.length} cars
                <span className="mx-2">·</span>
                Aug 12 - 18
              </span>
            }
          />
          <div className="mb-8 lg:mb-11">
            <TabFilters
              rangePrices={rangePrices}
              setRangePrices={setRangePrices}
              typeOfCarSelected={typeOfCarSelected}
              setTypeOfCarSelected={setTypeOfCarSelected}
            />
          </div>
          
          {filteredCars.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              No cars match your selected filters. Please try resetting your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredCars.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => setCurrentHoverID((_) => item.id)}
                  onMouseLeave={() => setCurrentHoverID((_) => -1)}
                >
                  <CarCardH data={item} />
                </div>
              ))}
            </div>
          )}

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
              defaultCenter={filteredCars[0]?.map || { lat: 55.2094559, lng: 61.5594641 }}
            >
              {filteredCars.map((item) => (
                <AnyReactComponent
                  isSelected={currentHoverID === item.id}
                  key={item.id}
                  lat={item.map.lat}
                  lng={item.map.lng}
                  car={item}
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
