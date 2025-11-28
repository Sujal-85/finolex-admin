import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "paid" | "unpaid" | "overdue" | "resolved" | "open" | "in_progress";
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const variants: Record<string, { className: string; label: string }> = {
    active: { className: "bg-success-light text-success border-success/20", label: "Active" },
    inactive: { className: "bg-muted text-muted-foreground border-muted", label: "Inactive" },
    pending: { className: "bg-warning-light text-warning border-warning/20", label: "Pending" },
    paid: { className: "bg-success-light text-success border-success/20", label: "Paid" },
    unpaid: { className: "bg-danger-light text-danger border-danger/20", label: "Unpaid" },
    overdue: { className: "bg-danger-light text-danger border-danger/20", label: "Overdue" },
    resolved: { className: "bg-success-light text-success border-success/20", label: "Resolved" },
    open: { className: "bg-warning-light text-warning border-warning/20", label: "Open" },
    in_progress: { className: "bg-primary-light text-primary border-primary/20", label: "In Progress" },
  };

  const config = variants[status] || variants.active;

  return (
    <Badge variant="outline" className={config.className}>
      {children || config.label}
    </Badge>
  );
}
