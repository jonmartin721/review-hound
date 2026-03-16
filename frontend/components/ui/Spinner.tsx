import { cn } from "@/lib/utils";

export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };
  return (
    <div className={cn("animate-spin inline-block border-2 border-primary border-t-transparent rounded-full", sizeClasses[size], className)} />
  );
}
