"use client";

import { CurrencyCode } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

type CurrencyPriceProps = {
  amount: number | string;
  fromCurrency?: CurrencyCode;
  className?: string;
};

export default function CurrencyPrice({
  amount,
  fromCurrency,
  className,
}: CurrencyPriceProps) {
  const { formatPrice, format } = useCurrency();

  const content =
    typeof amount === "string"
      ? formatPrice(amount, fromCurrency)
      : format(amount, fromCurrency || "VND");

  return <span className={className}>{content}</span>;
}