"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { ReactNode } from "react";

interface I18nProviderProps {
  children: ReactNode;
}

const I18nProvider = ({ children }: I18nProviderProps) => {
  useEffect(() => {
    const handleLanguageChange = (language: string) => {
      document.documentElement.lang = language;
      window.localStorage.setItem("site-language", language);
      document.cookie = `site-language=${language}; path=/; max-age=31536000`;
    };

    const storedLanguage = window.localStorage.getItem("site-language");
    if (storedLanguage === "vn" || storedLanguage === "en") {
      i18n.changeLanguage(storedLanguage);
      handleLanguageChange(storedLanguage);
    } else {
      handleLanguageChange(i18n.language);
    }

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;
