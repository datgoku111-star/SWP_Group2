"use client";

import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import SectionSubscribe2 from "@/components/SectionSubscribe2";
import SocialsList from "@/shared/SocialsList";
import Label from "@/components/Label";
import Input from "@/shared/Input";
import Textarea from "@/shared/Textarea";
import ButtonPrimary from "@/shared/ButtonPrimary";

export interface PageContactProps {}

const PageContact: FC<PageContactProps> = ({}) => {
  const { t } = useTranslation();

  const info = [
    {
      title: "🗺 " + t("contactAddressTitle"),
      desc: "Photo booth tattooed prism, portland taiyaki hoodie neutra typewriter",
    },
    {
      title: "💌 " + t("contactEmailTitle"),
      desc: "nc.example@example.com",
    },
    {
      title: "☎ " + t("contactPhoneTitle"),
      desc: "000-123-456-7890",
    },
  ];

  return (
    <div className={`nc-PageContact overflow-hidden`}>
      <div className="mb-24 lg:mb-32">
        <h2 className="my-16 sm:my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          {t("contactTitle")}
        </h2>
        <div className="container max-w-7xl mx-auto">
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-12 ">
            <div className="max-w-sm space-y-8">
              {info.map((item, index) => (
                <div key={index}>
                  <h3 className="uppercase font-semibold text-sm dark:text-neutral-200 tracking-wider">
                    {item.title}
                  </h3>
                  <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
                    {item.desc}
                  </span>
                </div>
              ))}
              <div>
                <h3 className="uppercase font-semibold text-sm dark:text-neutral-200 tracking-wider">
                  🌏 {t("contactSocialsTitle")}
                </h3>
                <SocialsList className="mt-2" />
              </div>
            </div>
            <div>
              <form className="grid grid-cols-1 gap-6" action="#" method="post">
                <label className="block">
                  <Label>{t("contactFullName")}</Label>

                  <Input
                    placeholder={t("contactFullNamePlaceholder")}
                    type="text"
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <Label>{t("contactEmailAddress")}</Label>

                  <Input
                    type="email"
                    placeholder={t("contactEmailPlaceholder")}
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <Label>{t("contactMessage")}</Label>

                  <Textarea className="mt-1" rows={6} />
                </label>
                <div>
                  <ButtonPrimary type="submit">
                    {t("contactSendMessage")}
                  </ButtonPrimary>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTHER SECTIONS */}
      <div className="container">
        <SectionSubscribe2 className="pb-24 lg:pb-32" />
      </div>
    </div>
  );
};

export default PageContact;
