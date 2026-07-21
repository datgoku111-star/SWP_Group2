"use client";

import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
  CurrencyDollarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "react-i18next";

export const headerCurrency = [
  {
    id: "USD",
    name: "USD",
    href: "##",
    icon: CurrencyDollarIcon,
    active: true,
  },
  {
    id: "VND",
    name: "VND",
    href: "##",
    icon: BanknotesIcon,
  },
];

export default function CurrencyDropdown({ className = "hidden md:flex" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const { t } = useTranslation();

  return (
    <Popover className={`CurrencyDropdown relative ${className}`}>
      {({ open, close }) => (
        <>
          <Popover.Button
            className={`
              ${open ? "" : "text-opacity-80"}
              group self-center h-10 sm:h-12 px-3 py-1.5 inline-flex items-center text-sm text-gray-800 dark:text-neutral-200 font-medium hover:text-opacity-100 focus:outline-none`}
          >
            <BanknotesIcon className="w-5 h-5 opacity-80" />
            <span className="ml-2 select-none">{t("currency")}</span>
            <ChevronDownIcon
              className={`${open ? "-rotate-180" : "text-opacity-70"}
                ml-2 h-4 w-4  group-hover:text-opacity-80 transition ease-in-out duration-150`}
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
            <Popover.Panel className="absolute z-10 w-screen max-w-[140px] px-4 mt-4 right-0 sm:px-0">
              <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="relative grid gap-7 bg-white dark:bg-neutral-800 p-7">
                  {headerCurrency.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      onClick={() => {
                        setCurrency(item.id as any);
                        close();
                      }}
                      className={`flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 ${
                        item.id === currency
                          ? "bg-gray-100 dark:bg-neutral-700"
                          : "opacity-80"
                      }`}
                    >
                      <item.icon className="w-[18px] h-[18px] " />
                      <p className="ml-2 text-sm font-medium ">{item.name}</p>
                    </a>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
