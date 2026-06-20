export type CurrencyCode =
  | "VND"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "KRW"
  | "CNY"
  | "AUD";

export type CurrencyOption = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
};

export const DEFAULT_CURRENCY: CurrencyCode = "VND";
export const DEFAULT_BASE_CURRENCY: CurrencyCode = "VND";

// 1 đơn vị tiền tệ = bao nhiêu VND
export const EXCHANGE_RATES_TO_VND: Record<CurrencyCode, number> = {
  VND: 1,
  USD: 25400,
  EUR: 27600,
  GBP: 32300,
  JPY: 175,
  KRW: 18.5,
  CNY: 3500,
  AUD: 16600,
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", locale: "vi-VN" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "KRW", name: "Korean Won", symbol: "₩", locale: "ko-KR" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
];

const NO_DECIMAL_CURRENCIES: CurrencyCode[] = ["VND", "JPY", "KRW"];

export function isCurrencyCode(
  value: string | null | undefined
): value is CurrencyCode {
  return !!value && Object.prototype.hasOwnProperty.call(EXCHANGE_RATES_TO_VND, value);
}

export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode = DEFAULT_BASE_CURRENCY,
  toCurrency: CurrencyCode = DEFAULT_CURRENCY
) {
  if (!Number.isFinite(amount)) return 0;

  const fromRate = EXCHANGE_RATES_TO_VND[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES_TO_VND[toCurrency] || 1;

  return (amount * fromRate) / toRate;
}

export function formatCurrency(
  amount: number,
  fromCurrency: CurrencyCode = DEFAULT_BASE_CURRENCY,
  toCurrency: CurrencyCode = DEFAULT_CURRENCY
) {
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);

  const option = CURRENCY_OPTIONS.find((item) => item.code === toCurrency);

  const maximumFractionDigits = NO_DECIMAL_CURRENCIES.includes(toCurrency)
    ? 0
    : 2;

  return new Intl.NumberFormat(option?.locale || "en-US", {
    style: "currency",
    currency: toCurrency,
    maximumFractionDigits,
  }).format(convertedAmount);
}

export function parseMoneyValue(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");

  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
}

export function detectCurrencyFromPrice(
  value: string | number | null | undefined
): CurrencyCode {
  if (typeof value === "number") return DEFAULT_BASE_CURRENCY;

  const text = String(value || "").toUpperCase();

  if (text.includes("VND") || text.includes("₫") || text.includes("Đ")) return "VND";
  if (text.includes("USD") || text.includes("$")) return "USD";
  if (text.includes("EUR") || text.includes("€")) return "EUR";
  if (text.includes("GBP") || text.includes("£")) return "GBP";
  if (text.includes("JPY")) return "JPY";
  if (text.includes("KRW") || text.includes("₩")) return "KRW";
  if (text.includes("CNY")) return "CNY";
  if (text.includes("AUD")) return "AUD";

  return DEFAULT_BASE_CURRENCY;
}

export function getCurrencyOption(currency: CurrencyCode) {
  return CURRENCY_OPTIONS.find((item) => item.code === currency) || CURRENCY_OPTIONS[0];
}