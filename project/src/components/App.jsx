import React, { useState, useEffect } from "react";
import CategoryList from "./CategoryList";

// Dữ liệu mock danh mục cho dịch vụ khách sạn
const MOCK_CATEGORIES = ["Thực đơn", "Đồ uống", "Giặt là", "Dọn phòng", "Spa & Wellness"];

/**
 * Component App để chạy thử và tích hợp CategoryList.
 * Cung cấp giao diện demo trực quan cho phép chuyển đổi giữa các trạng thái (Loading, Rỗng, Có Dữ Liệu)
 * để kiểm thử tính năng Conditional Rendering.
 */
export default function App() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Giả lập việc gọi API lấy danh mục dịch vụ từ server
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategories(MOCK_CATEGORIES);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Hàm chuyển đổi trạng thái sang "Rỗng" để test Conditional Rendering
  const simulateEmptyState = () => {
    setCategories([]);
    setActiveCategory("ALL");
  };

  // Hàm chuyển đổi trạng thái sang "Loading" và tải lại dữ liệu để test
  const simulateReloadState = () => {
    setIsLoading(true);
    setCategories([]);
    setTimeout(() => {
      setCategories(MOCK_CATEGORIES);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 my-10 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl">
      {/* Header điều hướng demo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            Quản Lý Dịch Vụ Khách Sạn
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Màn hình demo kiểm thử Conditional Rendering của CategoryList
          </p>
        </div>
        
        {/* Các nút bấm giả lập các trạng thái để kiểm thử */}
        <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl">
          <button 
            onClick={simulateEmptyState}
            className="px-3.5 py-1.5 bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            Giả lập Rỗng
          </button>
          <button 
            onClick={simulateReloadState}
            className="px-3.5 py-1.5 bg-primary-6000 text-white rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            Giả lập Tải lại
          </button>
        </div>
      </div>

      {/* Phần tích hợp và hiển thị Component CategoryList */}
      <div className="mb-8 p-6 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800">
        <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4">
          Lọc theo danh mục dịch vụ:
        </h2>
        
        <CategoryList
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          isLoading={isLoading}
        />
      </div>

      {/* Phần hiển thị nội dung/danh sách dịch vụ tương ứng với danh mục được chọn */}
      <div className="p-6 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl text-center border border-neutral-100 dark:border-neutral-800">
        <span className="text-sm text-neutral-400 dark:text-neutral-500 block mb-1">
          Trạng thái bộ lọc hiện tại:
        </span>
        <p className="text-neutral-700 dark:text-neutral-300 font-medium">
          Đang hiển thị danh sách cho danh mục:{" "}
          <span className="text-primary-6000 dark:text-primary-400 font-bold text-lg border-b-2 border-primary-100 dark:border-primary-900 pb-0.5 ml-1">
            {activeCategory}
          </span>
        </p>
      </div>
    </div>
  );
}
