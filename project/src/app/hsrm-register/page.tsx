"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Input from "@/shared/Input";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Link from "next/link";

export default function HSRMRegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      login(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <h2 className="my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
        Signup
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
              Full Name
            </span>
            <Input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="text-neutral-800 dark:text-neutral-200">
              Email address
            </span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="text-neutral-800 dark:text-neutral-200">
              Phone Number
            </span>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
              Password
            </span>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="mt-1"
            />
          </label>
          <ButtonPrimary type="submit" loading={loading} disabled={loading}>
            Continue
          </ButtonPrimary>
        </form>

        <span className="block text-center text-neutral-700 dark:text-neutral-300">
          Already have an account? {` `}
          <Link href="/hsrm-login" className="font-semibold underline">
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}
