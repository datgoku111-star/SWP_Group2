"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      // Redirect to HSRM login if unauthorized
      router.push("/hsrm-login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-6000 border-t-transparent"></div>
          <p className="text-sm font-medium text-neutral-500 animate-pulse">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null; // Render nothing while redirecting
  }

  return <>{children}</>;
}
