"use client";

import React, { FC, useState } from "react";
import { DEMO_CAR_LISTINGS } from "@/data/listings";
import { CarDataType } from "@/data/types";
import Pagination from "@/shared/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "@/shared/Heading2";
import CarCard from "@/components/CarCard";

export interface SectionGridFilterCardProps {
  className?: string;
  data?: CarDataType[];
}

const DEMO_DATA: CarDataType[] = DEMO_CAR_LISTINGS;

const carTypes = ["Small", "Medium", "Large", "SUV", "Van", "Luxury"];
const getCarType = (listingCategoryId: number | string): string => {
  const idNum = typeof listingCategoryId === "number" 
    ? listingCategoryId 
    : parseInt(String(listingCategoryId).replace(/[^0-9]/g, "")) || 0;
  return carTypes[idNum % carTypes.length];
};

const SectionGridFilterCard: FC<SectionGridFilterCardProps> = ({
  className = "",
  data = DEMO_DATA,
}) => {
  const [rangePrices, setRangePrices] = useState<number[]>([0, 1000]);
  const [typeOfCarSelected, setTypeOfCarSelected] = useState<string[]>([]);

  const filteredData = data.filter((car) => {
    // 1. Price filter
    const priceNum = Number(car.price.replace(/[^0-9]/g, "")) || 0;
    if (priceNum < rangePrices[0] || priceNum > rangePrices[1]) {
      return false;
    }

    // 2. Car Type filter
    if (typeOfCarSelected.length > 0) {
      const catId = car.listingCategory?.id || 0;
      const carType = getCarType(catId);
      if (!typeOfCarSelected.includes(carType)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className={`nc-SectionGridFilterCard ${className}`}>
      <Heading2
        heading="Cars in Tokyo"
        subHeading={
          <span className="block text-neutral-500 dark:text-neutral-400 mt-3">
            {filteredData.length} cars
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

      {filteredData.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          No cars match your selected filters. Please try resetting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((car) => (
            <CarCard key={car.id} data={car} />
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
