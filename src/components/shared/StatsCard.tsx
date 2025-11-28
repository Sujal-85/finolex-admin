import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconBgColor = "bg-primary-light",
  iconColor = "text-primary",
}: StatsCardProps) {
  const changeColorClass =
    changeType === "positive"
      ? "text-success"
      : changeType === "negative"
      ? "text-danger"
      : "text-muted-foreground";

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {change && (
              <p className={`text-xs font-medium ${changeColorClass}`}>
                {change}
              </p>
            )}
          </div>
          <div className={`rounded-lg ${iconBgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
