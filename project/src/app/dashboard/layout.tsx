"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";
import { 
  Compass, LayoutDashboard, 
  BedDouble, 
  Users, 
  UtensilsCrossed, 
  SprayCan, 
  ClipboardList, 
  CreditCard,
  Settings,
  LogOut,
  CalendarCheck,
  Car,
  Shirt
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null; // Middleware handles redirect

  const navItems = [
    { name: "Dashboard", href: `/dashboard/${user.role.toLowerCase()}`, icon: LayoutDashboard, roles: ["ADMIN", "RECEPTIONIST", "CUSTOMER"] },
    
    // Admin only
    { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Hotel Management", href: "/admin/hotels", icon: BedDouble, roles: ["ADMIN"] },
    { name: "Rooms & Types", href: "/admin/rooms", icon: BedDouble, roles: ["ADMIN"] },
    { name: "User Management", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { name: "Service Catalog", href: "/admin/services", icon: UtensilsCrossed, roles: ["ADMIN"] },
    { name: "Reports", href: "/admin/reports", icon: ClipboardList, roles: ["ADMIN"] },
    
    // Staff cross-functional
    { name: "Check-In / Out", href: "/checkin", icon: CalendarCheck, roles: ["ADMIN", "RECEPTIONIST"] },
    { name: "All Bookings", href: "/bookings", icon: ClipboardList, roles: ["ADMIN", "RECEPTIONIST"] },
    { name: "Service Orders", href: "/orders", icon: UtensilsCrossed, roles: ["ADMIN", "KITCHEN", "RECEPTIONIST"] },
    { name: "Car Orders", href: "/car-orders", icon: Car, roles: ["ADMIN", "RECEPTIONIST"] },
    { name: "Laundry Services", href: "/laundry-orders", icon: Shirt, roles: ["ADMIN", "RECEPTIONIST", "HOUSEKEEPING"] },
    { name: "Housekeeping", href: "/housekeeping", icon: SprayCan, roles: ["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"] },
    
    // Customer
    { name: "My Bookings", href: "/bookings", icon: CalendarCheck, roles: ["CUSTOMER"] },
    { name: "Booked Experiences", href: "/booked-experiences", icon: Compass, roles: ["CUSTOMER"] },
    { name: "Order Foods", href: "/services", icon: UtensilsCrossed, roles: ["CUSTOMER"] },
    { name: "Car Bookings", href: "/car-bookings", icon: Car, roles: ["CUSTOMER"] },
    { name: "Laundry Services", href: "/laundry-bookings", icon: Shirt, roles: ["CUSTOMER"] },
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary-6000">HotelOS Workspace</h2>
          <p className="text-sm text-neutral-500 mt-1">{user.role} Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {allowedNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href as Route}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive 
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" 
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-primary-6000" : "text-neutral-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <Link href={"/account" as Route} className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            <Settings className="w-5 h-5 mr-3 text-neutral-400" />
            Settings
          </Link>
          <button onClick={logout} className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-5 h-5 mr-3 text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
