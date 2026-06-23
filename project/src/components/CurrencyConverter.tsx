"use client";

import React, { useState } from "react";

export default function CurrencyConverter() {
  const [inputValue, setInputValue] = useState<string>("");
  const [sourceCurrency, setSourceCurrency] = useState<"USD" | "VND">("USD");

  const EXCHANGE_RATE = 26320;

  // Deriving state
  const usdValue = sourceCurrency === "USD"
    ? inputValue
    : (inputValue ? (parseFloat(inputValue) / EXCHANGE_RATE).toFixed(2) : "");

  const vndValue = sourceCurrency === "VND"
    ? inputValue
    : (inputValue ? Math.round(parseFloat(inputValue) * EXCHANGE_RATE).toString() : "");

  const handleInputChange = (value: string, currency: "USD" | "VND") => {
    // Block negative numbers
    if (value.startsWith("-")) return;

    // Validate number input format
    if (value === "") {
      setInputValue("");
      return;
    }

    if (currency === "USD") {
      // Allow only numbers and up to one decimal point
      if (/^\d*\.?\d*$/.test(value)) {
        setInputValue(value);
        setSourceCurrency("USD");
      }
    } else {
      // VND only allows integers (no cents)
      if (/^\d*$/.test(value)) {
        setInputValue(value);
        setSourceCurrency("VND");
      }
    }
  };

  // Formatters
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const vndFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formattedUSD = usdValue && !isNaN(parseFloat(usdValue))
    ? usdFormatter.format(parseFloat(usdValue))
    : "$0.00";

  const formattedVND = vndValue && !isNaN(parseFloat(vndValue))
    ? vndFormatter.format(parseInt(vndValue, 10))
    : "0 ₫";

  return (
    <div className="mt-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 space-y-4">
      <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-center">
        USD ⇄ VND Currency Converter
      </div>

      <div className="space-y-3">
        {/* USD Input */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Amount (USD)
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-500 text-sm">$</span>
            </div>
            <input
              type="text"
              name="usd-amount"
              id="usd-amount"
              className="block w-full pl-7 pr-3 py-1.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
              placeholder="0.00"
              value={usdValue}
              onChange={(e) => handleInputChange(e.target.value, "USD")}
            />
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center">
          <div className="p-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
              />
            </svg>
          </div>
        </div>

        {/* VND Input */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Amount (VND)
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-500 text-sm">₫</span>
            </div>
            <input
              type="text"
              name="vnd-amount"
              id="vnd-amount"
              className="block w-full pl-7 pr-3 py-1.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
              placeholder="0"
              value={vndValue}
              onChange={(e) => handleInputChange(e.target.value, "VND")}
            />
          </div>
        </div>
      </div>

      {/* Formatting Section */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs space-y-1.5 text-neutral-600 dark:text-neutral-400">
        <div className="flex justify-between">
          <span>Formatted USD:</span>
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-200">
            {formattedUSD}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Formatted VND:</span>
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-200">
            {formattedVND}
          </span>
        </div>
        <div className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 pt-1 font-mono">
          Rate: 1 USD = 26,320 VND
        </div>
      </div>
    </div>
  );
}
