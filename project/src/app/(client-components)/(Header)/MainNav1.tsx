import React, { FC } from "react";
import Logo from "@/shared/Logo";
import Navigation from "@/shared/Navigation/Navigation";
import SearchDropdown from "./SearchDropdown";
import ButtonPrimary from "@/shared/ButtonPrimary";
import MenuBar from "@/shared/MenuBar";
import SwitchDarkMode from "@/shared/SwitchDarkMode";
import HeroSearchForm2MobileFactory from "../(HeroSearchForm2Mobile)/HeroSearchForm2MobileFactory";
import LangDropdown from "./LangDropdown";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import NotifyDropdown from "./NotifyDropdown";
import AvatarDropdown from "./AvatarDropdown";
import { useTranslations } from "@/lib/translate";

export interface MainNav1Props {
  className?: string;
}

const MainNav1: FC<MainNav1Props> = ({ className = "" }) => {
  const { user } = useAuth();
  const { t } = useTranslations();

  return (
    <div className={`nc-MainNav1 relative z-10 ${className}`}>
      <div className="px-4 lg:container h-20 relative flex justify-between">
        <div className="hidden md:flex justify-start flex-1 space-x-4 sm:space-x-10">
          <Logo className="w-24 self-center" />
          <Navigation />
        </div>

        <div className="flex lg:hidden flex-[3] max-w-lg !mx-auto md:px-3 ">
          <div className="self-center flex-1">
            <HeroSearchForm2MobileFactory />
          </div>
        </div>

        <div className="hidden md:flex flex-shrink-0 justify-end flex-1 lg:flex-none text-neutral-700 dark:text-neutral-100">
          <div className="hidden xl:flex items-center space-x-0.5">
            <SwitchDarkMode />
            <SearchDropdown className="flex items-center" />
            <div className="px-1" />
            
            {user ? (
              <>
                <NotifyDropdown />
                <div className="px-1" />
                <AvatarDropdown />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="self-center text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 px-3 py-2"
                >
                  {t("Sign in")}
                </Link>
                <ButtonPrimary className="self-center" href="/signup">
                  {t("Sign up")}
                </ButtonPrimary>
              </div>
            )}
          </div>

          <div className="flex xl:hidden items-center">
            <SwitchDarkMode />
            <div className="px-0.5" />
            {user && (
              <>
                <NotifyDropdown />
                <div className="px-0.5" />
                <AvatarDropdown />
                <div className="px-0.5" />
              </>
            )}
            <MenuBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNav1;

