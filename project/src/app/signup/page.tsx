"use client";

import React, { useState, Suspense } from "react";
import facebookSvg from "@/images/Facebook.svg";
import twitterSvg from "@/images/Twitter.svg";
import googleSvg from "@/images/Google.svg";
import Input from "@/shared/Input";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { supabaseBrowser } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";

const loginSocials = [
  {
    nameKey: "signupSocialFacebook",
    href: "#",
    icon: facebookSvg,
  },
  {
    nameKey: "signupSocialTwitter",
    href: "#",
    icon: twitterSvg,
  },
  {
    nameKey: "signupSocialGoogle",
    href: "#",
    icon: googleSvg,
  },
];

const SignUpPageContent = () => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push(callbackUrl as Route);
    }
  }, [user, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // 1. Basic validation
    if (!email || !password || !confirmPassword || !fullName) {
      setError(t("signupCompleteAllFields"));
      return;
    }

    if (password.length < 6) {
      setError(t("signupPasswordHint"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("signupPasswordsMismatch"));
      return;
    }

    // 2. Call Supabase signUp
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "CUSTOMER", // default role
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check if user is auto-confirmed or requires email confirmation
      if (data.session) {
        setMessage(t("signupSuccessRedirect"));
        setTimeout(() => {
          router.push(callbackUrl as Route);
        }, 1500);
      } else {
        setMessage(t("signupConfirmationMessage"));
        // Clear form fields
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      console.error("Sign up failed:", err);
      setError(err.message || t("signupRegistrationError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`nc-PageSignUp`}>
      <div className="container mb-24 lg:mb-32">
        <h2 className="my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          {t("signUp")}
        </h2>
        <div className="max-w-md mx-auto space-y-6">
          <div className="grid gap-3">
            {loginSocials.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="nc-will-change-transform flex w-full rounded-lg bg-primary-50 dark:bg-neutral-800 px-4 py-3 transform transition-transform sm:px-6 hover:translate-y-[-2px]"
              >
                <Image
                  className="flex-shrink-0"
                  src={item.icon}
                  alt={t(item.nameKey)}
                />
                <h3 className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {t(item.nameKey)}
                </h3>
              </a>
            ))}
          </div>
          {/* OR */}
          <div className="relative text-center">
            <span className="relative z-10 inline-block px-4 font-medium text-sm bg-white dark:text-neutral-400 dark:bg-neutral-900">
              {t("loginOr")}
            </span>
            <div className="absolute left-0 w-full top-1/2 transform -translate-y-1/2 border border-neutral-100 dark:border-neutral-800"></div>
          </div>
          {/* FORM */}
          <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm dark:bg-red-950/35 dark:text-red-300">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm dark:bg-green-950/35 dark:text-green-300">
                {message}
              </div>
            )}

            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("signupFullName")}
              </span>
              <Input
                type="text"
                placeholder={t("signupFullNamePlaceholder")}
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("signupEmailAddress")}
              </span>
              <Input
                type="email"
                placeholder={t("signupEmailPlaceholder")}
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("signupPasswordLabel")}
              </span>
              <Input
                type="password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("signupConfirmPassword")}
              </span>
              <Input
                type="password"
                className="mt-1"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            <ButtonPrimary type="submit" loading={loading} disabled={loading}>
              {t("loginContinue")}
            </ButtonPrimary>
          </form>

          {/* ==== */}
          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            {t("signupAlreadyHaveAccount")} {` `}
            <Link href="/login" className="font-semibold underline">
              {t("signupSignIn")}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default function PageSignUp() {
  return (
    <Suspense
      fallback={
        <div className="container py-20 text-center">
          Loading signup page...
        </div>
      }
    >
      <SignUpPageContent />
    </Suspense>
  );
}
