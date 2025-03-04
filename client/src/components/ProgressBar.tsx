import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
  backgroundClass?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  colorClass = "bg-primary",
  backgroundClass = "bg-primary/20"
}: ProgressBarProps) {
  // Ensure value is within bounds
  const boundedValue = Math.max(0, Math.min(value, max));
  
  // Calculate percentage
  const percentage = (boundedValue / max) * 100;
  
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full",
        backgroundClass,
        className
      )}
    >
      <div
        className={cn(colorClass, "h-full transition-all duration-300 ease-in-out")}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
} 