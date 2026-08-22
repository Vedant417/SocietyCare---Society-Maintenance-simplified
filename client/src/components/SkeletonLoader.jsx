import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 space-y-4 animate-pulse shadow-sm">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="bg-brand-card border border-brand-gray/40 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center justify-between py-2.5 border-b border-brand-gray/20">
            <div className="h-4 bg-gray-200 rounded w-1/6" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/12" />
            <div className="h-4 bg-gray-200 rounded w-1/12" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimelineSkeleton = () => {
  return (
    <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 space-y-6 animate-pulse shadow-sm">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="relative border-l-2 border-gray-100 pl-6 ml-4 space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[31px] mt-0.5 w-4 h-4 bg-gray-200 rounded-full border-2 border-white" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
