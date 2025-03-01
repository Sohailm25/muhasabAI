import React from 'react';

export function MasjidLoadingAnimation() {
  return (
    <div className="masjid-loading-container p-3 md:p-4 mb-2 md:mb-4 bg-primary/5 rounded-lg border border-primary/10">
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="masjid-animation hidden xs:block">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-[60px] md:h-[60px]">
            {/* Dome */}
            <path className="dome animate-dome-build" d="M50 10 C20 10, 20 40, 50 40 C80 40, 80 10, 50 10" stroke="currentColor" strokeWidth="3" fill="none" />
            
            {/* Minaret left */}
            <rect className="minaret animate-minaret-left" x="20" y="40" width="5" height="30" fill="currentColor" />
            <rect className="minaret-top animate-minaret-top-left" x="19" y="35" width="7" height="5" fill="currentColor" />
            
            {/* Minaret right */}
            <rect className="minaret animate-minaret-right" x="75" y="40" width="5" height="30" fill="currentColor" />
            <rect className="minaret-top animate-minaret-top-right" x="74" y="35" width="7" height="5" fill="currentColor" />
            
            {/* Base */}
            <rect className="base animate-base-build" x="10" y="70" width="80" height="10" fill="currentColor" />
            
            {/* Door */}
            <rect className="door animate-door-build" x="45" y="50" width="10" height="20" fill="currentColor" />
          </svg>
        </div>
        <div className="flex flex-col">
          <p className="text-sm md:text-base font-medium text-primary">Crafting response...</p>
          <div className="dots-loading flex text-base md:text-lg">
            <span className="animate-dots-1">.</span>
            <span className="animate-dots-2">.</span>
            <span className="animate-dots-3">.</span>
          </div>
        </div>
      </div>
    </div>
  );
} 