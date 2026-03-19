import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface SourceBadgeProps {
  source: string;
  url?: string | null;
  size?: "sm" | "md";
}

const SOURCE_LABELS: Record<string, string> = {
  trustpilot: "TrustPilot",
  bbb: "BBB",
  yelp: "Yelp",
  yelp_api: "Yelp (API)",
  google_places: "Google",
};

export function SourceBadge({ source, url, size = "sm" }: SourceBadgeProps) {
  const label = SOURCE_LABELS[source] || source;
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : undefined;

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
        <Badge variant="outline" className={sizeClass}>
          {label}
          <ExternalLink className="ml-1 h-3 w-3" />
        </Badge>
      </a>
    );
  }

  return (
    <Badge variant="outline" className={sizeClass}>
      {label}
    </Badge>
  );
}
