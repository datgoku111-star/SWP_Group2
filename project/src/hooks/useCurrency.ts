import { useEffect } from "react";
import { createGlobalState } from "react-hooks-global-state";

export type CurrencyType = "USD" | "VND";

const initialState = { currency: "USD" as CurrencyType };
const { useGlobalState } = createGlobalState(initialState);

export const useCurrency = () => {
  const [currency, setCurrencyState] = useGlobalState("currency");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("currency") as CurrencyType | null;
      if (savedCurrency && (savedCurrency === "USD" || savedCurrency === "VND")) {
        setCurrencyState(savedCurrency);
      }
    }
  }, [setCurrencyState]);

  const setCurrency = (newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("currency", newCurrency);
    }
  };

  const EXCHANGE_RATE = 26320;

  // Converts any price value.
  // We can pass a parameter `inputUnit` (default: 'USD') to know what currency the input price is in.
  const convertPrice = (amount: number, inputUnit: CurrencyType = "USD"): number => {
    if (inputUnit === currency) return amount;
    if (inputUnit === "USD" && currency === "VND") {
      return Math.round(amount * EXCHANGE_RATE);
    }
    if (inputUnit === "VND" && currency === "USD") {
      return parseFloat((amount / EXCHANGE_RATE).toFixed(2));
    }
    return amount;
  };

  // Formats any price value.
  // We pass `amount` and `inputUnit` (default: 'USD')
  const formatPrice = (amount: number, inputUnit: CurrencyType = "USD"): string => {
    const converted = convertPrice(amount, inputUnit);
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted);
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    }
  };

  return {
    currency,
    setCurrency,
    convertPrice,
    formatPrice,
    EXCHANGE_RATE,
  };
};
