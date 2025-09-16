import React from 'react';

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 w-full animate-pulse ${className}`}>
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-neutral-200 rounded col-span-2"></div>
                <div className="h-4 bg-neutral-200 rounded col-span-1"></div>
            </div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
    </div>
  );
};

export default SkeletonCard;
