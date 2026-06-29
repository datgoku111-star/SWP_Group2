import React from "react";

/**
 * Component hiển thị danh sách các danh mục (Category)
 * Sử dụng Conditional Rendering cho các trạng thái: Đang tải (Loading), Danh sách rỗng, và Hiển thị danh sách chính.
 * 
 * @param {Object} props
 * @param {Array} props.categories - Danh sách tên danh mục hoặc object danh mục
 * @param {string} props.activeCategory - Danh mục hiện tại đang được chọn
 * @param {Function} props.onSelectCategory - Hàm xử lý khi chọn một danh mục mới
 * @param {boolean} props.isLoading - Trạng thái đang tải dữ liệu danh mục
 */
export default function CategoryList({ categories, activeCategory, onSelectCategory, isLoading }) {
  // 1. Conditional rendering: Trạng thái đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-6000 mr-2"></div>
        <span className="text-neutral-500 text-sm font-medium">Đang tải danh mục...</span>
      </div>
    );
  }

  // 2. Conditional rendering: Trạng thái danh sách rỗng
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
        <p className="font-medium text-sm">Không có danh mục nào khả dụng.</p>
        <p className="text-xs text-neutral-400 mt-1">Vui lòng kiểm tra lại cấu hình hoặc dữ liệu dịch vụ.</p>
      </div>
    );
  }

  // 3. Render danh sách chính khi có dữ liệu
  return (
    <div className="flex flex-wrap gap-2 pb-4">
      <button
        onClick={() => onSelectCategory("ALL")}
        className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
          activeCategory === "ALL"
            ? "bg-primary-6000 text-white shadow-md scale-105"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
        }`}
      >
        Tất cả
      </button>
      
      {categories.map((cat) => {
        const catName = typeof cat === "string" ? cat : cat.name;
        const catKey = typeof cat === "string" ? cat : (cat.id || cat.name);
        
        return (
          <button
            key={catKey}
            onClick={() => onSelectCategory(catName)}
            className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
              activeCategory === catName
                ? "bg-primary-6000 text-white shadow-md scale-105"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {catName}
          </button>
        );
      })}
    </div>
  );
}
