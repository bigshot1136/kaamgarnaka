import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Loader2, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  pending: { 
    icon: Clock, 
    label: "Pending", 
    variant: "secondary" as const,
    className: "bg-chart-4/20 text-chart-4 border-chart-4/30"
  },
  assigned: { 
    icon: CheckCircle2, 
    label: "Assigned", 
    variant: "secondary" as const,
    className: "bg-primary/20 text-primary border-primary/30"
  },
  in_progress: { 
    icon: Loader2, 
    label: "In Progress", 
    variant: "secondary" as const,
    className: "bg-chart-2/20 text-chart-2 border-chart-2/30"
  },
  ready_for_review: { 
    icon: AlertCircle, 
    label: "Ready for Review", 
    variant: "secondary" as const,
    className: "bg-chart-4/20 text-chart-4 border-chart-4/30"
  },
  completed: { 
    icon: CheckCircle2, 
    label: "Completed", 
    variant: "secondary" as const,
    className: "bg-chart-3/20 text-chart-3 border-chart-3/30"
  },
  cancelled: { 
    icon: XCircle, 
    label: "Cancelled", 
    variant: "secondary" as const,
    className: "bg-destructive/20 text-destructive border-destructive/30"
  },
  passed: { 
    icon: CheckCircle2, 
    label: "Passed", 
    variant: "secondary" as const,
    className: "bg-chart-3/20 text-chart-3 border-chart-3/30"
  },
  failed: { 
    icon: XCircle, 
    label: "Failed", 
    variant: "secondary" as const,
    className: "bg-destructive/20 text-destructive border-destructive/30"
  },
  pending_review: { 
    icon: AlertCircle, 
    label: "Pending Review", 
    variant: "secondary" as const,
    className: "bg-chart-4/20 text-chart-4 border-chart-4/30"
  },
  available: { 
    icon: CheckCircle2, 
    label: "Available", 
    variant: "secondary" as const,
    className: "bg-chart-3/20 text-chart-3 border-chart-3/30"
  },
  busy: { 
    icon: Clock, 
    label: "Busy", 
    variant: "secondary" as const,
    className: "bg-chart-2/20 text-chart-2 border-chart-2/30"
  },
  unavailable: { 
    icon: XCircle, 
    label: "Unavailable", 
    variant: "secondary" as const,
    className: "bg-muted/50 text-muted-foreground border-muted"
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
