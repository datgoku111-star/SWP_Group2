"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { Route } from "@/routers/types";
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarCheck, 
  Users,
  LogOut, 
  Home,
  Compass,
  CreditCard
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isCreateRoute = pathname?.startsWith("/admin/incidents/create") || pathname?.startsWith("/admin/lost-found/create");

  if (isCreateRoute) {
    return <div className="container py-12">{children}</div>;
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Hotels & Rooms", href: "/admin/rooms", icon: BedDouble },
    { name: "Experiences", href: "/admin/experiences", icon: Compass },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Lost & Found", href: "/admin/lost-found", icon: Compass },
    { name: "User Management", href: "/admin/users", icon: Users },
  ];

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
        
        {/* Fixed Left Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col fixed h-screen z-20">
          
          {/* Logo Brand */}
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-700">
            <h2 className="text-xl font-extrabold text-primary-6000 flex items-center space-x-2">
              <span className="bg-primary-6000 text-white p-1.5 rounded-lg text-sm">H</span>
              <span>HotelOS Admin</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-semibold tracking-wider uppercase">
              Management Portal
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href as Route}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-primary-6000" : "text-neutral-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-700 space-y-1">
            <Link 
              href="/"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <Home className="w-4 h-4 mr-3 text-neutral-400" />
              Trang chủ
            </Link>
            <button 
              onClick={logout}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 text-red-500" />
              Đăng xuất
            </button>
          </div>

        </aside>

        {/* Content Area offset by Sidebar width */}
        <div className="flex-1 pl-64 flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>
        </div>

      </div>
    </AdminProtectedRoute>
  );
}
