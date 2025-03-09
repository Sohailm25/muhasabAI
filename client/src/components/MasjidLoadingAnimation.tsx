import React from 'react';

export function MasjidLoadingAnimation() {
  return (
    <div className="loading-container p-3 md:p-4 mb-2 md:mb-4 bg-primary/5 rounded-lg border border-primary/10">
      <div className="flex items-center">
        <p className="text-sm md:text-base font-medium text-primary">
          Crafting Response
          <span className="dots-loading">
            <span className="animate-dots-1">.</span>
            <span className="animate-dots-2">.</span>
            <span className="animate-dots-3">.</span>
          </span>
        </p>
      </div>
    </div>
  );
} 