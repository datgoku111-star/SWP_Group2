"use client";

import React, { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  Clock, 
  Search, 
  CreditCard, 
  User, 
  ShoppingBag, 
  BedDouble
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

interface PaymentItem {
  id: string;
  booking_id: string;
  amount: number; // in USD (base) or VND (food)
  method: string;
  status: "PENDING" | "COMPLETED" | "REFUNDED";
  transaction_ref: string;
  created_at: string;
  guest_name: string;
  guest_email: string;
  type: "room" | "service";
  details: string; // descriptive text
  serviceOrderId?: string;
  serviceItemsText?: string;
  roomName?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ROOM" | "SERVICE">("ALL");

  // Fetch pending payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) {
        throw new Error("Failed to fetch payments from server");
      }
      const data = await res.json();
      if (data) {
        setPayments(data);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Approve payment
  const handleApprove = async (item: PaymentItem) => {
    if (!confirm(`Xác nhận đã nhận tiền thanh toán cho đơn hàng của ${item.guest_name}?`)) return;

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "approve" })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to approve payment");
      }

      alert("Xác nhận thanh toán thành công!");
      fetchPayments();
    } catch (err: any) {
      alert("Lỗi phê duyệt thanh toán: " + err.message);
    }
  };

  // Reject/Cancel payment
  const handleReject = async (item: PaymentItem) => {
    if (!confirm(`Hủy bỏ và từ chối giao dịch này của ${item.guest_name}?`)) return;

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "reject" })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to reject payment");
      }

      alert("Đã từ chối giao dịch!");
      fetchPayments();
    } catch (err: any) {
      alert("Lỗi xử lý: " + err.message);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    // 1. Search Query filter
    const matchesSearch = 
      p.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transaction_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Active Tab filter
    if (activeTab === "ROOM" && p.type !== "room") return false;
    if (activeTab === "SERVICE" && p.type !== "service") return false;

    return true;
  });

  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary-6000" />
          Xác nhận Thanh toán Giao dịch
        </h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Kiểm tra tài khoản ngân hàng và đối soát nội dung chuyển khoản để phê duyệt giao dịch khách hàng quét từ PayOS VietQR.
        </p>
      </div>

      {/* Control Bar (Search & Tabs) */}
      <div className="flex flex-col md:flex-row bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex space-x-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "ALL" 
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("ROOM")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "ROOM" 
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            Đặt phòng
          </button>
          <button
            onClick={() => setActiveTab("SERVICE")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "SERVICE" 
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Gọi món / Dịch vụ
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên khách, mã GD hoặc phòng..."
            className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Khách Hàng</th>
                <th scope="col" className="px-6 py-4">Loại GD</th>
                <th scope="col" className="px-6 py-4">Nội Dung CK / Mã GD</th>
                <th scope="col" className="px-6 py-4">Số Tiền (VND)</th>
                <th scope="col" className="px-6 py-4">Chi Tiết Giao Dịch</th>
                <th scope="col" className="px-6 py-4">Trạng Thái</th>
                <th scope="col" className="px-6 py-4 text-right">Phê Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-500 dark:text-neutral-400 font-semibold">
                    Đang tải dữ liệu giao dịch...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-500 dark:text-neutral-400 font-medium">
                    Không tìm thấy giao dịch thanh toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPending = p.status === "PENDING";
                  // Calculate VND equivalent: If it's a food service, the price is already in VND. If room, base is USD -> convert to VND at 26,320
                  const amountVnd = p.type === "service" ? p.amount : p.amount * 26320;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-neutral-400" />
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white">{p.guest_name}</div>
                            <div className="text-xs text-neutral-400">{p.guest_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.type === "service" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Đồ ăn / Dịch vụ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                            <BedDouble className="w-3.5 h-3.5" />
                            Đặt phòng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-neutral-950 dark:text-neutral-100">
                        {/* Show PayOS description code */}
                        <div>
                          Pay {p.details.split(" ")[1]?.slice(0, 15) || p.roomName?.slice(0, 15) || "Service"}
                        </div>
                        <div className="text-xs text-neutral-400 font-normal font-sans">
                          Mã orderCode: {p.transaction_ref.split("_")[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-secondary-6000 text-base">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amountVnd)}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-neutral-600 dark:text-neutral-300 font-medium">
                        {p.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.status === "COMPLETED" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Đã duyệt
                          </span>
                        ) : p.status === "REFUNDED" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            <X className="w-3.5 h-3.5 mr-1" />
                            Đã từ chối
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            <Clock className="w-3.5 h-3.5 mr-1 text-yellow-600 dark:text-yellow-400" />
                            Chờ đối soát
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApprove(p)}
                                className="px-3 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
                                title="Xác nhận nhận tiền thành công"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleReject(p)}
                                className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                title="Hủy / Từ chối giao dịch"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-neutral-400 font-semibold italic">Đã xử lý</span>
                          )}
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
