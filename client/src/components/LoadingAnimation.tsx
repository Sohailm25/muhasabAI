import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingAnimationProps {
  message?: string;
}

export function LoadingAnimation({ message = "Processing your reflection..." }: LoadingAnimationProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-md w-full flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">{message}</h3>
            <p className="text-sm text-muted-foreground">
              We're analyzing your reflection and generating thoughtful questions.
            </p>
          </div>
        </div>
        
        <div className="w-full mt-4">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
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