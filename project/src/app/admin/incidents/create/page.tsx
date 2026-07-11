import React from "react";
import IncidentForm from "@/components/incidents/IncidentForm";

export default function CreateIncidentPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi nhận sự cố mới</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Điền thông tin chi tiết về sự cố phòng, đồ thất lạc hoặc yêu cầu bảo trì.
        </p>
      </div>

      {/* Gọi Component Form */}
      <IncidentForm />
    </div>
  );
}