import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer bg-white dark:bg-gray-800"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`min-w-9 h-9 text-xs rounded-lg font-bold border transition ${
            currentPage === pageNum
              ? "bg-brand-500 border-brand-500 text-white shadow-sm"
              : "border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800"
          }`}
        >
          {pageNum}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer bg-white dark:bg-gray-800"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
