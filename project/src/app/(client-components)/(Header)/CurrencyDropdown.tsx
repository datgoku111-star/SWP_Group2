"use client";

import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
  CurrencyDollarIcon,
  CurrencyEuroIcon,
  CurrencyPoundIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { CurrencyCode } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

export const headerCurrency: {
  id: CurrencyCode;
  name: CurrencyCode;
  description: string;
  href: string;
  icon: typeof BanknotesIcon;
}[] = [
  {
    id: "VND",
    name: "VND",
    description: "Vietnamese Dong",
    href: "##",
    icon: BanknotesIcon,
  },
  {
    id: "USD",
    name: "USD",
    description: "US Dollar",
    href: "##",
    icon: CurrencyDollarIcon,
  },
  {
    id: "EUR",
    name: "EUR",
    description: "Euro",
    href: "##",
    icon: CurrencyEuroIcon,
  },
  {
    id: "GBP",
    name: "GBP",
    description: "British Pound",
    href: "##",
    icon: CurrencyPoundIcon,
  },
  {
    id: "JPY",
    name: "JPY",
    description: "Japanese Yen",
    href: "##",
    icon: BanknotesIcon,
  },
  {
    id: "KRW",
    name: "KRW",
    description: "Korean Won",
    href: "##",
    icon: BanknotesIcon,
  },
  {
    id: "CNY",
    name: "CNY",
    description: "Chinese Yuan",
    href: "##",
    icon: BanknotesIcon,
  },
  {
    id: "AUD",
    name: "AUD",
    description: "Australian Dollar",
    href: "##",
    icon: CurrencyDollarIcon,
  },
];

export default function CurrencyDropdown() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="CurrencyDropdown">
      <Popover className="relative">
        {({ open, close }) => (
          <>
            <Popover.Button
              className={`
                ${open ? "" : "text-opacity-80"}
                group px-3 py-1.5 border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 rounded-full inline-flex items-center text-sm text-gray-700 dark:text-neutral-300 font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              <BanknotesIcon className="w-5 h-5 opacity-80" />
              <span className="ml-2 select-none">{currency}</span>
              <ChevronDownIcon
                className={`${open ? "-rotate-180" : "text-opacity-70"}
                  ml-2 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150`}
                aria-hidden="true"
              />
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-10 w-screen max-w-[190px] px-4 mt-4 right-0 sm:px-0">
                <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative grid gap-2 bg-white dark:bg-neutral-800 p-4">
                    {headerCurrency.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrency(item.id);
                          close();
                        }}
                        className={`flex items-center p-2 transition duration-150 ease-in-out rounded-lg text-left hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 ${
                          currency === item.id
                            ? "bg-gray-100 dark:bg-neutral-700"
                            : "opacity-80"
                        }`}
                      >
                        <item.icon className="w-[18px] h-[18px]" />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}