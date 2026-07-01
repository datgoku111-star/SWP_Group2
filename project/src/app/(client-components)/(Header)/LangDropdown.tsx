"use client";

import { Popover, Transition } from "@headlessui/react";
import { GlobeAltIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { FC, Fragment } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

export const headerLanguage = [
  {
    id: "en",
    active: true,
  },
  {
    id: "vn",
  },
];

interface LangDropdownProps {
  panelClassName?: string;
  className?: string;
}

function getLanguageLabel(languageId: string, t: (key: string) => string) {
  return languageId === "vn" ? t("vietnamese") : t("english");
}

const LangDropdown: FC<LangDropdownProps> = ({
  panelClassName = "top-full right-0 max-w-xs w-72",
  className = "hidden md:flex",
}) => {
  const { t } = useTranslation();

  const renderLang = (close: () => void) => {
    return (
      <div className="grid gap-2">
        {headerLanguage.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              i18n.changeLanguage(item.id);
              close();
            }}
            className={`flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 ${
              i18n.language === item.id
                ? "bg-gray-100 dark:bg-gray-700"
                : "opacity-80"
            }`}
          >
            <div className="">
              <p className="text-sm font-medium ">
                {getLanguageLabel(item.id, t)}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const currentLanguage = i18n.language === "vn" ? "vn" : "en";

  return (
    <>
      <Popover className={`LangDropdown relative ${className}`}>
        {({ open, close }) => (
          <>
            <Popover.Button
              className={`
                ${open ? "" : "text-opacity-80"}
             group self-center h-10 sm:h-12 px-3 py-1.5 inline-flex items-center text-sm text-gray-800 dark:text-neutral-200 font-medium hover:text-opacity-100 focus:outline-none `}
            >
              <GlobeAltIcon className="w-5 h-5 opacity-80" />
              <span className="mx-2">
                {getLanguageLabel(currentLanguage, t)}
              </span>
              <ChevronDownIcon
                className={`${open ? "-rotate-180" : "text-opacity-70"}
                  ml-1 h-4 w-4  group-hover:text-opacity-80 transition ease-in-out duration-150`}
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
              <Popover.Panel className={`absolute z-20  ${panelClassName}`}>
                <div className="p-3 sm:p-6 rounded-2xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="rounded-xl p-3 focus:outline-none focus:ring-0">
                    {renderLang(close)}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
};
export default LangDropdown;
