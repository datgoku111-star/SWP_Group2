"use client";

import React from "react";
import I404Png from "@/images/404.png";
import Image from "next/image";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { useTranslation } from "react-i18next";

const Page404 = () => {
  const { t } = useTranslation();

  return (
    <div className="nc-Page404">
      <div className="container relative pt-5 pb-16 lg:pb-20 lg:pt-5">
        <header className="text-center max-w-2xl mx-auto space-y-2">
          <Image src={I404Png} alt="not-found" />
          <span className="block text-sm text-neutral-800 sm:text-base dark:text-neutral-200 tracking-wider font-medium">
            {t("notFoundMessage")}
          </span>
          <div className="pt-8">
            <ButtonPrimary href="/">{t("notFoundCta")}</ButtonPrimary>
          </div>
        </header>
      </div>
    </div>
  );
};

export default Page404;
