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
import { supabaseBrowser } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";

const loginSocials = [
  {
    name: "Continue with Facebook",
    href: "#",
    icon: facebookSvg,
  },
  {
    name: "Continue with Twitter",
    href: "#",
    icon: twitterSvg,
  },
  {
    name: "Continue with Google",
    href: "#",
    icon: googleSvg,
  },
];

const LoginPageContent = () => {
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
      const targetUrl = user.role === "ADMIN" ? "/admin/dashboard" : callbackUrl;
      router.push(targetUrl as Route);
    }
  }, [user, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Try Supabase Auth first
      const { data: sbData, error: loginError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        // 2. If Supabase Auth fails, try local DB authentication API
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(loginError.message || data.error || "Email hoặc mật khẩu không đúng");
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

      // Successful Supabase login - AuthContext subscription will handle updating state
      router.push(callbackUrl as Route);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`nc-PageLogin`}>
      <div className="container mb-24 lg:mb-32">
        <h2 className="my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          Login
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
                  alt={item.name}
                />
                <h3 className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {item.name}
                </h3>
              </a>
            ))}
          </div>
          {/* OR */}
          <div className="relative text-center">
            <span className="relative z-10 inline-block px-4 font-medium text-sm bg-white dark:text-neutral-400 dark:bg-neutral-900">
              OR
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
              <span className="text-neutral-800 dark:text-neutral-200">
                Email address
              </span>
              <Input
                type="email"
                placeholder="example@example.com"
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                Password
                <Link href="/login" className="text-sm underline font-medium">
                  Forgot password?
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
            <ButtonPrimary type="submit" loading={loading} disabled={loading}>Continue</ButtonPrimary>
          </form>

          {/* ==== */}
          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            New user? {` `}
            <Link href="/signup" className="font-semibold underline">
              Create an account
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default function PageLogin() {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Loading login page...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
