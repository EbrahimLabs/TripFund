import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface FundManagerBadgeProps {
  className?: string;
}

export function FundManagerBadge({ className }: FundManagerBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-[9px] px-1.5 py-0 h-4 gap-0.5 font-medium border-accent/40 text-accent-foreground bg-accent/90 ${className || ""}`}
    >
      <Crown className="h-2.5 w-2.5" />
      FM
    </Badge>
  );
}
