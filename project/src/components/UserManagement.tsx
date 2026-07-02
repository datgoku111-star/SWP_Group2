"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { useTranslation } from "react-i18next";

const supabase = supabaseBrowser;

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  is_blocked: boolean;
  created_at: string;
}

export default function UserManagement() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "new" | "old">("all");

  // Danh sách dữ liệu mẫu (Mock data) hiển thị phòng hờ khi chưa kết nối Supabase hoặc bảng trống
  const getMockProfiles = (): Profile[] => {
    const today = new Date();

    const dateNew1 = new Date();
    dateNew1.setDate(today.getDate() - 2); // Đăng ký 2 ngày trước

    const dateNew2 = new Date();
    dateNew2.setDate(today.getDate() - 5); // Đăng ký 5 ngày trước

    const dateOld1 = new Date();
    dateOld1.setDate(today.getDate() - 10); // Đăng ký 10 ngày trước

    const dateOld2 = new Date();
    dateOld2.setDate(today.getDate() - 30); // Đăng ký 30 ngày trước

    return [
      {
        id: "mock-1",
        email: "nguyenvanmoi@gmail.com",
        full_name: "Nguyễn Văn Mới (Demo)",
        role: "user",
        is_blocked: false,
        created_at: dateNew1.toISOString(),
      },
      {
        id: "mock-2",
        email: "tranvancu@gmail.com",
        full_name: "Trần Văn Cũ (Demo)",
        role: "user",
        is_blocked: false,
        created_at: dateOld1.toISOString(),
      },
      {
        id: "mock-3",
        email: "lethimoi@gmail.com",
        full_name: "Lê Thị Mới (Demo)",
        role: "user",
        is_blocked: true,
        created_at: dateNew2.toISOString(),
      },
      {
        id: "mock-4",
        email: "phamquantri@hotel.com",
        full_name: "Phạm Quản Trị (Demo Admin)",
        role: "admin",
        is_blocked: false,
        created_at: dateOld2.toISOString(),
      },
    ];
  };

  // Hàm tải dữ liệu người dùng từ bảng `profiles` của Supabase
  const fetchProfiles = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Gọi dữ liệu từ bảng profiles của Supabase, sắp xếp tài khoản mới tạo lên trước
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Profile[] = data.map((p: any) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.email.split("@")[0],
          role: p.role === "admin" ? "admin" : "user",
          is_blocked: !!p.is_blocked,
          created_at: p.created_at,
        }));
        setProfiles(mapped);
      } else {
        // Nếu database trống, hiển thị mock data để demo giao diện hoạt động
        setProfiles(getMockProfiles());
      }
    } catch (err: any) {
      console.warn(t("userManagementLoadFallback"), err.message);
      setErrorMsg(t("userManagementFallbackMessage"));
      setProfiles(getMockProfiles());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Hàm chuyển đổi vai trò người dùng thành Admin
  const handleMakeAdmin = async (id: string) => {
    if (!confirm(t("userManagementConfirmPromote"))) return;

    try {
      if (id.startsWith("mock-")) {
        // Cập nhật local state đối với dữ liệu mẫu
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, role: "admin" } : p)),
        );
      } else {
        // Cập nhật trực tiếp lên Supabase
        const { error } = await supabase
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", id);

        if (error) throw error;
        await fetchProfiles();
      }
    } catch (err: any) {
      alert(t("userManagementPromoteError") + err.message);
    }
  };

  // Hàm Khóa / Mở khóa tài khoản
  const handleToggleBlock = async (profile: Profile) => {
    const actionText = profile.is_blocked
      ? t("userManagementUnblock")
      : t("userManagementBlock");
    if (
      !confirm(
        `${t("userManagementConfirmActionPrefix")} ${actionText} ${t("userManagementConfirmActionSuffix")}`,
      )
    )
      return;

    try {
      if (profile.id.startsWith("mock-")) {
        // Cập nhật local state đối với dữ liệu mẫu
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profile.id ? { ...p, is_blocked: !p.is_blocked } : p,
          ),
        );
      } else {
        // Cập nhật trạng thái is_blocked trên Supabase
        const { error } = await supabase
          .from("profiles")
          .update({ is_blocked: !profile.is_blocked })
          .eq("id", profile.id);

        if (error) throw error;
        await fetchProfiles();
      }
    } catch (err: any) {
      alert(
        `${t("userManagementActionErrorPrefix")} ${actionText} ${t("userManagementActionErrorSuffix")} ` +
          err.message,
      );
    }
  };

  // Kiểm tra xem user có phải đăng ký trong vòng 7 ngày qua hay không
  const isNewUser = (createdAtStr: string): boolean => {
    const createdAt = new Date(createdAtStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Định dạng ngày đăng ký thành dd/mm/yyyy
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Bộ lọc tìm kiếm theo Email hoặc Tên người dùng
  const searchedProfiles = profiles.filter(
    (p) =>
      (p.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Bộ lọc phân loại User mới / User cũ
  const filteredProfiles = searchedProfiles.filter((p) => {
    const isNew = isNewUser(p.created_at);
    if (activeTab === "new") return isNew;
    if (activeTab === "old") return !isNew;
    return true; // Tất cả
  });

  return (
    <div className="w-full space-y-6">
      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center space-x-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
          <button
            onClick={fetchProfiles}
            className="ml-auto underline flex items-center space-x-1 hover:text-amber-950 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("userManagementRetry")}</span>
          </button>
        </div>
      )}

      {/* Thanh công cụ (Toolbar) & Bộ lọc */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
        {/* Bộ nút Tabs lọc nhanh */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === "all"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {t("userManagementTabAll")} ({searchedProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === "new"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {t("userManagementTabNew")} (
            {searchedProfiles.filter((p) => isNewUser(p.created_at)).length})
          </button>
          <button
            onClick={() => setActiveTab("old")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === "old"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {t("userManagementTabOld")} (&gt; {t("userManagementDays")}) (
            {searchedProfiles.filter((p) => !isNewUser(p.created_at)).length})
          </button>
        </div>

        {/* Ô Tìm kiếm */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={t("userManagementSearchPlaceholder")}
            className="block w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-white font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng Dữ liệu người dùng (Table) */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4.5 w-16 text-center">
                  {t("userManagementTableNo")}
                </th>
                <th scope="col" className="px-6 py-4.5">
                  {t("userManagementTableName")}
                </th>
                <th scope="col" className="px-6 py-4.5">
                  Email
                </th>
                <th scope="col" className="px-6 py-4.5">
                  {t("userManagementTableCreatedAt")}{" "}
                </th>
                <th scope="col" className="px-6 py-4.5">
                  {t("userManagementTableRole")}
                </th>
                <th scope="col" className="px-6 py-4.5 text-center">
                  {t("userManagementTableType")}
                </th>
                <th scope="col" className="px-6 py-4.5 text-right">
                  {t("userManagementTableActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                // Trạng thái đang tải dữ liệu (Skeleton Loading)
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-6 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-14 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-32 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredProfiles.length === 0 ? (
                // Trường hợp danh sách trống
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-neutral-500 dark:text-neutral-400 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                      <span>{t("userManagementEmptyState")}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p, index) => {
                  const isNew = isNewUser(p.created_at);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/10 transition-colors ${
                        p.is_blocked ? "bg-red-50/20 dark:bg-red-950/5" : ""
                      }`}
                    >
                      {/* Số thứ tự (STT) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-neutral-500 dark:text-neutral-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* Tên người dùng */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-neutral-700 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold text-xs uppercase border border-primary-100 dark:border-neutral-600">
                            {p.full_name ? (
                              p.full_name[0]
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {p.full_name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300 font-semibold">
                        {p.email}
                      </td>

                      {/* Ngày đăng ký (Định dạng dd/mm/yyyy) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-neutral-500 dark:text-neutral-400 font-medium space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{formatDate(p.created_at)}</span>
                        </div>
                      </td>

                      {/* Quyền hạn (Role) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.role === "admin" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-550/10 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {t("userManagementAdmin")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                            {t("userManagementMember")}
                          </span>
                        )}
                      </td>

                      {/* Phân loại (Mới / Cũ / Đã khóa) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isNew && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              {t("userManagementNew")}
                            </span>
                          )}
                          {!isNew && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-50 text-neutral-500 border border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-400 dark:border-neutral-750">
                              {t("userManagementOld")}
                            </span>
                          )}
                          {p.is_blocked && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-650 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
                              {t("userManagementBlocked")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Nút thăng cấp Admin */}
                          {p.role !== "admin" && (
                            <button
                              onClick={() => handleMakeAdmin(p.id)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors flex items-center space-x-1"
                              title={t("userManagementPromoteTitle")}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{t("userManagementPromote")}</span>
                            </button>
                          )}

                          {/* Nút Khóa / Mở khóa tài khoản */}
                          <button
                            onClick={() => handleToggleBlock(p)}
                            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                              p.is_blocked
                                ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                            title={
                              p.is_blocked
                                ? t("userManagementUnblockTitle")
                                : t("userManagementBlockTitle")
                            }
                          >
                            {p.is_blocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>{t("userManagementUnblock")}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>{t("userManagementBlock")}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
