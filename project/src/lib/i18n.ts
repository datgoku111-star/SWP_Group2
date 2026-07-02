"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "@/locales/en/common.json";
import vnCommon from "@/locales/vn/common.json";

const resources = {
  en: {
    common: enCommon,
  },
  vn: {
    common: vnCommon,
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "vn",
    fallbackLng: "vn",
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
