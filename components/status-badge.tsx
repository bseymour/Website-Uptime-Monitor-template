import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "up" | "down" | "degraded" | "unknown";
  size?: "sm" | "md";
}

const statusConfig = {
  up: {
    label: "Operational",
    dotClass: "bg-success",
    bgClass: "bg-success/10 text-success",
  },
  down: {
    label: "Down",
    dotClass: "bg-destructive",
    bgClass: "bg-destructive/10 text-destructive",
  },
  degraded: {
    label: "Degraded",
    dotClass: "bg-warning",
    bgClass: "bg-warning/10 text-warning",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-muted-foreground",
    bgClass: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgClass,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          config.dotClass,
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

interface StatusDotProps {
  status: "up" | "down" | "degraded";
}

export function StatusDot({ status }: StatusDotProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", config.dotClass)}
      aria-label={config.label}
    />
  );
}
