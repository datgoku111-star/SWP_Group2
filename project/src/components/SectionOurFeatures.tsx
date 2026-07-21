"use client";

import React, { FC } from "react";
import rightImgPng from "@/images/our-features.png";
import Image, { StaticImageData } from "next/image";
import Badge from "@/shared/Badge";
import { useTranslation } from "react-i18next";

export interface SectionOurFeaturesProps {
  className?: string;
  rightImg?: StaticImageData;
  type?: "type1" | "type2";
}

const SectionOurFeatures: FC<SectionOurFeaturesProps> = ({
  className = "lg:py-14",
  rightImg = rightImgPng,
  type = "type1",
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`nc-SectionOurFeatures relative flex flex-col items-center ${
        type === "type1" ? "lg:flex-row" : "lg:flex-row-reverse"
      } ${className}`}
      data-nc-id="SectionOurFeatures"
    >
      <div className="flex-grow">
        <Image src={rightImg} alt="" />
      </div>
      <div
        className={`max-w-2xl flex-shrink-0 mt-10 lg:mt-0 lg:w-2/5 ${
          type === "type1" ? "lg:pl-16" : "lg:pr-16"
        }`}
      >
        <span className="uppercase text-sm text-gray-400 tracking-widest">
          {t("ourFeaturesEyebrow")}
        </span>
        <h2 className="font-semibold text-4xl mt-5">{t("ourFeaturesTitle")}</h2>

        <ul className="space-y-10 mt-16">
          <li className="space-y-4">
            <Badge name={t("ourFeaturesBadgeAdvertising")} />
            <span className="block text-xl font-semibold">
              {t("ourFeaturesAdvertisingTitle")}
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              {t("ourFeaturesAdvertisingDesc")}
            </span>
          </li>
          <li className="space-y-4">
            <Badge color="green" name={t("ourFeaturesBadgeExposure")} />
            <span className="block text-xl font-semibold">
              {t("ourFeaturesExposureTitle")}
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              {t("ourFeaturesExposureDesc")}
            </span>
          </li>
          <li className="space-y-4">
            <Badge color="red" name={t("ourFeaturesBadgeSecure")} />
            <span className="block text-xl font-semibold">
              {t("ourFeaturesSecureTitle")}
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              {t("ourFeaturesSecureDesc")}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SectionOurFeatures;
