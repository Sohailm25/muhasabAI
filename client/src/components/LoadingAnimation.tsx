import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingAnimationProps = {
  message?: string;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingAnimation({ 
  message = "Loading...", 
  fullScreen = false,
  className 
}: LoadingAnimationProps) {
  const containerClass = cn(
    "flex flex-col items-center justify-center p-8",
    fullScreen ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "h-full min-h-[200px]",
    className
  );
  
  return (
    <div className={containerClass}>
      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
      {message && <p className="text-muted-foreground text-center">{message}</p>}
    </div>
  );
}

// Add this to your global CSS file
// @keyframes progress {
//   0% { width: 0%; }
//   50% { width: 70%; }
//   100% { width: 100%; }
// }
// 
// .animate-progress {
//   animation: progress 3s ease-in-out infinite;
// } 