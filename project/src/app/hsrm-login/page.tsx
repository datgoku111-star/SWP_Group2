"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";
import Input from "@/shared/Input";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Link from "next/link";

export default function HSRMLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.user);
      const targetUrl =
        data.user.role === "ADMIN" ? "/admin/dashboard" :
        data.user.role === "RECEPTIONIST" ? "/dashboard/receptionist" :
        data.user.role === "HOUSEKEEPING" ? "/housekeeping" :
        data.user.role === "KITCHEN" ? "/orders" :
        callbackUrl;
      router.push(targetUrl as Route);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <h2 className="my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
        Login
      </h2>
      <div className="max-w-md mx-auto space-y-6">
        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
          <label className="block">
            <span className="text-neutral-800 dark:text-neutral-200">
              Email address
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
              Password
            </span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </label>
          <ButtonPrimary type="submit" loading={loading} disabled={loading}>
            Continue
          </ButtonPrimary>
        </form>

        <span className="block text-center text-neutral-700 dark:text-neutral-300">
          New user? {` `}
          <Link href="/hsrm-register" className="font-semibold underline">
            Create an account
          </Link>
        </span>
      </div>
    </div>
  );
}
