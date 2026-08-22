import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 select-none w-full">
      {/* Page Size Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Page Size</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none pl-3 pr-8 py-1.5 bg-brand-ivory/50 border border-brand-gray rounded-xl text-xs text-brand-charcoal font-semibold cursor-pointer outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Pages Controls */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-extrabold text-brand-charcoal">
          {currentPage} / {totalPages || 1}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
