"use client";

import React from "react";
import { Users } from "lucide-react";
import UserManagement from "@/components/UserManagement";

export default function AdminUsersPage() {
  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      {/* Tiêu đề trang quản lý */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center space-x-3">
            <Users className="w-8 h-8 text-primary-600" />
            <span>Quản Lý Thành Viên</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1.5 text-sm">
            Quản lý và phân loại tài khoản người dùng, thăng cấp quản trị viên và khóa tài khoản thành viên.
          </p>
        </div>
      </div>

      {/* Component UserManagement chính */}
      <UserManagement />
    </div>
  );
}
