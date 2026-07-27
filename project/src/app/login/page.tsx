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
    nameKey: "loginSocialFacebook",
    href: "#",
    icon: facebookSvg,
  },
  {
    nameKey: "loginSocialTwitter",
    href: "#",
    icon: twitterSvg,
  },
  {
    nameKey: "loginSocialGoogle",
    href: "#",
    icon: googleSvg,
  },
];

const LoginPageContent = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      let targetUrl = callbackUrl;
      if (user.role === "ADMIN") targetUrl = "/admin/dashboard";
      else if (user.role === "RECEPTIONIST") targetUrl = "/dashboard/receptionist";
      else if (user.role === "HOUSEKEEPING") targetUrl = "/dashboard/housekeeping";
      else if (user.role === "KITCHEN") targetUrl = "/dashboard/kitchen";
      
      router.push(targetUrl as Route);
    }
  }, [user, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Try Supabase Auth first
      let sbData = null;
      let loginError = null;
      
      try {
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });
        sbData = data;
        loginError = error;
      } catch (sbException: any) {
        console.warn("Supabase auth threw exception, trying local fallback:", sbException);
        loginError = { message: sbException.message || "Failed to fetch" };
      }

      if (loginError) {
        // 2. If Supabase Auth fails, try local DB authentication API
        let res;
        try {
          res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
        } catch (fetchErr: any) {
          throw new Error("Failed to connect to authentication server. Your Supabase project might be paused or deleted. Please check your Supabase Dashboard or verify NEXT_PUBLIC_SUPABASE_URL in .env.local.");
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || loginError.message || "Email hoặc mật khẩu không đúng");
        }

        // Successful local DB login
        login(data.user);
        const targetUrl =
          data.user.role === "ADMIN" ? "/admin/dashboard" :
          data.user.role === "RECEPTIONIST" ? "/dashboard/receptionist" :
          data.user.role === "HOUSEKEEPING" ? "/housekeeping" :
          data.user.role === "KITCHEN" ? "/orders" :
          callbackUrl;
        router.push(targetUrl as Route);
        return;
      }

      // Successful Supabase login - Sync session to cookie first to prevent race conditions on redirect
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (session) {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session }),
          });
        }
      } catch (syncErr) {
        console.error("Failed to sync session on login:", syncErr);
      }

      router.push(callbackUrl as Route);
    } catch (err: any) {
      console.error("Login failed:", err);
      let errMsg = err.message || "Email hoặc mật khẩu không đúng";
      if (errMsg.includes("Failed to fetch") || errMsg.includes("fetch failed") || errMsg.includes("fetch")) {
        errMsg = "Không thể kết nối đến Supabase (Failed to fetch). Dự án Supabase có thể đã bị tạm dừng (Paused) hoặc cấu hình NEXT_PUBLIC_SUPABASE_URL trong .env.local chưa chính xác. Vui lòng đăng nhập vào Supabase Dashboard để kích hoạt lại dự án của bạn.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`nc-PageLogin`}>
      <div className="container mb-24 lg:mb-32">
        <h2 suppressHydrationWarning className="my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          {t("Login")}
        </h2>
        <div className="max-w-md mx-auto space-y-6">
          <div className="grid gap-3">
            {loginSocials.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex w-full rounded-lg bg-primary-50 dark:bg-neutral-800 px-4 py-3 transform transition-transform sm:px-6 hover:translate-y-[-2px]"
              >
                <Image
                  className="flex-shrink-0"
                  src={item.icon}
                  alt={t(item.nameKey)}
                />
                <h3 suppressHydrationWarning className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {t(item.nameKey)}
                </h3>
              </a>
            ))}
          </div>
          {/* OR */}
          <div className="relative text-center">
            <span suppressHydrationWarning className="relative z-10 inline-block px-4 font-medium text-sm bg-white dark:text-neutral-400 dark:bg-neutral-900">
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
            <label className="block">
              <span suppressHydrationWarning className="text-neutral-800 dark:text-neutral-200">
                {t("loginEmailAddress")}
              </span>
              <Input
                type="email"
                placeholder={t("loginEmailPlaceholder")}
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span suppressHydrationWarning className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                {t("loginPassword")}
                <Link href="/login" className="text-sm underline font-medium">
                  {t("loginForgotPassword")}
                </Link>
              </span>
              <Input
                type="password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <ButtonPrimary type="submit" loading={loading} disabled={loading}>
              {t("loginContinue")}
            </ButtonPrimary>
          </form>

          {/* ==== */}
          <span suppressHydrationWarning className="block text-center text-neutral-700 dark:text-neutral-300">
            {t("loginNewUser")} {` `}
            <Link href="/signup" className="font-semibold underline">
              {t("loginCreateAccount")}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default function PageLogin() {
  return (
    <Suspense
      fallback={
        <div className="container py-20 text-center">Loading login page...</div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
