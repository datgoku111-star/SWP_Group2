"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { SafeUser } from "@/types/hotel";
import { supabaseBrowser } from "@/lib/supabase";

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (user: SafeUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<SafeUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map Supabase User to SafeUser structure
  const mapSupabaseUserToSafeUser = (sbUser: any): SafeUser | null => {
    if (!sbUser) return null;
    return {
      id: sbUser.id,
      email: sbUser.email || "",
      full_name: sbUser.user_metadata?.full_name || sbUser.email?.split("@")[0] || "User",
      phone: sbUser.user_metadata?.phone || "",
      role: sbUser.user_metadata?.role || "CUSTOMER",
      is_active: sbUser.user_metadata?.is_active ?? true,
      created_at: sbUser.created_at || new Date().toISOString(),
      updated_at: sbUser.updated_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    // 1. Check current session on mount and sync with API
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        
        if (session) {
          // Sync session to backend cookie
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session }),
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(mapSupabaseUserToSafeUser(session.user));
          }
        } else {
          // Try fetching local fallback session if no Supabase session
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 2. Listen to Supabase auth changes
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Sync cookie on login/session change
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session }),
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(mapSupabaseUserToSafeUser(session.user));
          }
          setIsLoading(false);
        } else {
          // Only clear and set loading false on active SIGNED_OUT event.
          // For initial load (INITIAL_SESSION) with no Supabase session,
          // we let initAuth() handle the local fallback check.
          if (event === "SIGNED_OUT") {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session: null }),
            });
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: SafeUser) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // 1. Sign out from Supabase (triggers onAuthStateChange sync)
      await supabaseBrowser.auth.signOut();
      
      // 2. Force hit logout endpoint to delete any residual cookie
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      
      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const updateUser = (updates: Partial<SafeUser>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
