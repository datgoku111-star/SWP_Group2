import React from "react";
import LostFoundForm from "@/components/lost-found/LostFoundForm";

export default function CreateLostFoundPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi nhận đồ thất lạc</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Vui lòng điền chi tiết tình trạng và đặc điểm nhận dạng của vật dụng nhặt được.
        </p>
      </div>

      {/* Tích hợp Form */}
      <LostFoundForm />
    </div>
  );
}