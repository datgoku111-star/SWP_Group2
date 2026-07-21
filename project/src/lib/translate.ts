import { usePathname } from "next/navigation";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

export type SupportedLocale = "en" | "vi";

const TRANSLATIONS: Record<SupportedLocale, any> = {
  en,
  vi,
};

const DEFAULT_LOCALE: SupportedLocale = "en";

const getValueByKey = (obj: any, key: string): string | undefined => {
  if (!obj || !key) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
  return key.split(".").reduce((value, part) => {
    if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, part)) {
      return value[part];
    }
    return undefined;
  }, obj);
};

const getTranslation = (locale: SupportedLocale, key: string): string | undefined => {
  const rootValue = getValueByKey(TRANSLATIONS[locale], key);
  if (typeof rootValue === "string") return rootValue;

  const stringsValue = getValueByKey(TRANSLATIONS[locale]?.strings, key);
  if (typeof stringsValue === "string") return stringsValue;

  return undefined;
};

export const getLocaleFromPathname = (pathname?: string): SupportedLocale => {
  if (!pathname) return DEFAULT_LOCALE;
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith("/vi") || normalized === "/vi") {
    return "vi";
  }
  return "en";
};

export const translateByKey = (
  locale: string | undefined,
  key: string,
  fallback?: string
): string => {
  const localeKey = locale === "vi" ? "vi" : "en";
  const translation = getTranslation(localeKey, key);
  if (translation) return translation;

  if (localeKey !== DEFAULT_LOCALE) {
    const defaultTranslation = getTranslation(DEFAULT_LOCALE, key);
    if (defaultTranslation) return defaultTranslation;
  }

  return fallback ?? key;
};

export const useTranslations = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  return {
    locale,
    t: (key: string, fallback?: string) => translateByKey(locale, key, fallback),
  };
};

export const getTranslator = (locale?: string) => {
  const localeKey = locale === "vi" ? "vi" : "en";
  return {
    locale: localeKey as SupportedLocale,
    t: (key: string, fallback?: string) => translateByKey(localeKey, key, fallback),
  };
};
