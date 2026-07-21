"use client";

import Logo from "@/shared/Logo";
import SocialsList1 from "@/shared/SocialsList1";
import { CustomLink } from "@/data/types";
import React from "react";
import FooterNav from "./FooterNav";
import { useTranslation } from "react-i18next";

export interface WidgetFooterMenu {
  id: string;
  title: string;
  menus: CustomLink[];
}

const widgetMenus: Array<
  Omit<WidgetFooterMenu, "title" | "menus"> & {
    titleKey: string;
    menuKeys: { href: string; labelKey: string }[];
  }
> = [
  {
    id: "5",
    titleKey: "footerGettingStarted",
    menuKeys: [
      { href: "#", labelKey: "footerInstallation" },
      { href: "#", labelKey: "footerReleaseNotes" },
      { href: "#", labelKey: "footerUpgradeGuide" },
      { href: "#", labelKey: "footerBrowserSupport" },
      { href: "#", labelKey: "footerEditorSupport" },
    ],
  },
  {
    id: "1",
    titleKey: "footerExplore",
    menuKeys: [
      { href: "#", labelKey: "footerDesignFeatures" },
      { href: "#", labelKey: "footerPrototyping" },
      { href: "#", labelKey: "footerDesignSystems" },
      { href: "#", labelKey: "footerPricing" },
      { href: "#", labelKey: "footerSecurity" },
    ],
  },
  {
    id: "2",
    titleKey: "footerResources",
    menuKeys: [
      { href: "#", labelKey: "footerBestPractices" },
      { href: "#", labelKey: "footerSupport" },
      { href: "#", labelKey: "footerDevelopers" },
      { href: "#", labelKey: "footerLearnDesign" },
      { href: "#", labelKey: "footerReleases" },
    ],
  },
  {
    id: "4",
    titleKey: "footerCommunity",
    menuKeys: [
      { href: "#", labelKey: "footerDiscussionForums" },
      { href: "#", labelKey: "footerCodeOfConduct" },
      { href: "#", labelKey: "footerCommunityResources" },
      { href: "#", labelKey: "footerContributing" },
      { href: "#", labelKey: "footerConcurrentMode" },
    ],
  },
];

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const renderWidgetMenuItem = (menu: WidgetFooterMenu, index: number) => {
    return (
      <div key={index} className="text-sm">
        <h2 className="font-semibold text-neutral-700 dark:text-neutral-200">
          {menu.title}
        </h2>
        <ul className="mt-5 space-y-4">
          {menu.menus.map((item, index) => (
            <li key={index}>
              <a
                key={index}
                className="text-neutral-6000 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const localizedWidgetMenus: WidgetFooterMenu[] = widgetMenus.map((menu) => ({
    id: menu.id,
    title: t(menu.titleKey),
    menus: menu.menuKeys.map((item) => ({
      href: item.href,
      label: t(item.labelKey),
    })),
  }));

  return (
    <>
      <FooterNav />

      <div className="nc-Footer relative py-24 lg:py-28 border-t border-neutral-200 dark:border-neutral-700">
        <div className="container grid grid-cols-2 gap-y-10 gap-x-5 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-10 ">
          <div className="grid grid-cols-4 gap-5 col-span-2 md:col-span-4 lg:md:col-span-1 lg:flex lg:flex-col">
            <div className="col-span-2 md:col-span-1">
              <Logo />
            </div>
            <div className="col-span-2 flex items-center md:col-span-3">
              <SocialsList1 className="flex items-center space-x-3 lg:space-x-0 lg:flex-col lg:space-y-2.5 lg:items-start" />
            </div>
          </div>
          {localizedWidgetMenus.map(renderWidgetMenuItem)}
        </div>
      </div>
    </>
  );
};

export default Footer;
