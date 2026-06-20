"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  CurrencyCode,
  convertCurrency,
  detectCurrencyFromPrice,
  formatCurrency,
  getCurrencyOption,
  isCurrencyCode,
  parseMoneyValue,
} from "./currency";

const STORAGE_KEY = "hsrm-selected-currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  currencyOption: ReturnType<typeof getCurrencyOption>;
  currencies: typeof CURRENCY_OPTIONS;
  setCurrency: (currency: CurrencyCode) => void;
  convert: (amount: number, fromCurrency?: CurrencyCode) => number;
  format: (amount: number, fromCurrency?: CurrencyCode) => string;
  formatPrice: (price: string | number, fallbackFromCurrency?: CurrencyCode) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    const savedCurrency = window.localStorage.getItem(STORAGE_KEY);

    if (isCurrencyCode(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  };

  const value = useMemo<CurrencyContextValue>(() => {
    return {
      currency,
      currencyOption: getCurrencyOption(currency),
      currencies: CURRENCY_OPTIONS,
      setCurrency,
      convert: (amount, fromCurrency = "VND") =>
        convertCurrency(amount, fromCurrency, currency),
      format: (amount, fromCurrency = "VND") =>
        formatCurrency(amount, fromCurrency, currency),
      formatPrice: (price, fallbackFromCurrency) => {
        const sourceCurrency = fallbackFromCurrency || detectCurrencyFromPrice(price);
        return formatCurrency(parseMoneyValue(price), sourceCurrency, currency);
      },
    };
  }, [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }

  return context;
}