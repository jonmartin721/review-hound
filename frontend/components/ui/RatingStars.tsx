import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingStars({ rating, size = "md", className }: RatingStarsProps) {
  if (rating == null) return null;
  const filled = Math.round(rating);
  const sizeClasses = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <span className={cn("text-primary", sizeClasses[size], className)}>
      {"★".repeat(filled)}{"☆".repeat(Math.max(0, 5 - filled))}
    </span>
  );
}
