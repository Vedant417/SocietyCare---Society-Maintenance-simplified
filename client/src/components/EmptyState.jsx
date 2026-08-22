import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onActionClick 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-brand-card border border-brand-gray/40 rounded-3xl min-h-[300px] w-full animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-5 shadow-sm border border-brand-primary/15">
        {icon}
      </div>
      <h3 className="text-lg font-extrabold text-brand-charcoal mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary-light text-white text-sm font-bold shadow-md shadow-brand-primary/15 hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
