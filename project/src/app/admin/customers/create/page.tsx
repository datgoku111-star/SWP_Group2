import React from "react";
import CustomerForm from "@/components/loyalty/CustomerForm";

export default function CreateCustomerPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thêm tài khoản khách hàng mới</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Tạo tài khoản thành viên để bắt đầu tích lũy điểm thưởng và theo dõi phân hạng khách hàng.
        </p>
      </div>

      <CustomerForm />
    </div>
  );
}