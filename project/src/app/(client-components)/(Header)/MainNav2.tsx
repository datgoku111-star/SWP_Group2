import React, { FC } from "react";
import Logo from "@/shared/Logo";
import MenuBar from "@/shared/MenuBar";
import LangDropdown from "./LangDropdown";
import NotifyDropdown from "./NotifyDropdown";
import AvatarDropdown from "./AvatarDropdown";
import DropdownTravelers from "./DropdownTravelers";
import HeroSearchForm2MobileFactory from "../(HeroSearchForm2Mobile)/HeroSearchForm2MobileFactory";
import Link from "next/link";
import TemplatesDropdown from "./TemplatesDropdown";
import { Route } from "@/routers/types";
import { useAuth } from "@/lib/auth-context";
import ButtonPrimary from "@/shared/ButtonPrimary";

export interface MainNav2Props {
  className?: string;
}

const MainNav2: FC<MainNav2Props> = ({ className = "" }) => {
  const { user } = useAuth();

  return (
    <div className={`MainNav2 relative z-10 ${className}`}>
      <div className="px-4 h-20 lg:container flex justify-between">
        <div className="hidden md:flex justify-start flex-1 space-x-3 sm:space-x-8 lg:space-x-10">
          <Logo className="w-24 self-center" />
          <div className="hidden lg:block self-center h-10 border-l border-neutral-300 dark:border-neutral-500"></div>
          <div className="hidden lg:flex ">
            <DropdownTravelers />
          </div>
        </div>

        <div className="self-center lg:hidden flex-[3] max-w-lg !mx-auto md:px-3">
          <HeroSearchForm2MobileFactory />
        </div>

        <div className="hidden md:flex flex-shrink-0 justify-end flex-1 lg:flex-none text-neutral-700 dark:text-neutral-100">
          <div className="hidden lg:flex space-x-1">
            <TemplatesDropdown />
            <LangDropdown />
            {user?.role === "RECEPTIONIST" ? (
              <Link
                href={"/dashboard/receptionist" as Route<string>}
                className="self-center px-4 py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-full inline-flex items-center text-sm font-semibold mr-2 shadow-sm transition-all"
              >
                🏢 Receptionist Portal
              </Link>
            ) : user?.role === "ADMIN" ? (
              <Link
                href={"/admin/dashboard" as Route<string>}
                className="self-center px-4 py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-full inline-flex items-center text-sm font-semibold mr-2 shadow-sm transition-all"
              >
                ⚡ Admin Dashboard
              </Link>
            ) : user?.role === "HOUSEKEEPING" ? (
              <Link
                href={"/housekeeping" as Route<string>}
                className="self-center px-4 py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-full inline-flex items-center text-sm font-semibold mr-2 shadow-sm transition-all"
              >
                🧹 Housekeeping Grid
              </Link>
            ) : user?.role === "KITCHEN" ? (
              <Link
                href={"/orders" as Route<string>}
                className="self-center px-4 py-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-full inline-flex items-center text-sm font-semibold mr-2 shadow-sm transition-all"
              >
                🍳 Kitchen Orders
              </Link>
            ) : (
              <Link
                href={"/add-listing" as Route<string>}
                className="self-center text-opacity-90 group px-4 py-2 border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 rounded-full inline-flex items-center text-sm text-gray-700 dark:text-neutral-300 font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 mr-2"
              >
                List your property
              </Link>
            )}

            {user ? (
              <>
                <NotifyDropdown />
                <AvatarDropdown />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="self-center text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 px-4 py-2"
                >
                  Sign in
                </Link>
                <ButtonPrimary href="/signup" className="self-center">
                  Sign up
                </ButtonPrimary>
              </div>
            )}
          </div>
          <div className="flex space-x-2 lg:hidden items-center">
            {user && <NotifyDropdown />}
            {user && <AvatarDropdown />}
            <MenuBar />
          </div>
        </div>
      </div>
    </div>
  );
};


export default MainNav2;
