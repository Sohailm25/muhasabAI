import { cn } from "@/lib/utils";

type InlineLoadingProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function InlineLoading({ size = "md", className }: InlineLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
} 