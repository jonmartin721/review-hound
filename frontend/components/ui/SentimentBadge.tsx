import { Badge } from "@/components/ui/badge";

interface SentimentBadgeProps {
  label: string | null | undefined;
  score?: number | null;
  size?: "sm" | "md";
}

export function SentimentBadge({ label, score, size = "sm" }: SentimentBadgeProps) {
  const sentiment = label || "neutral";
  const variant = (sentiment === "positive" || sentiment === "negative" || sentiment === "neutral")
    ? sentiment as "positive" | "negative" | "neutral"
    : "neutral";

  return (
    <Badge variant={variant} className={size === "md" ? "px-2 py-1 text-sm" : undefined}>
      {sentiment.toUpperCase()}
      {score != null && ` (${score.toFixed(2)})`}
    </Badge>
  );
}
