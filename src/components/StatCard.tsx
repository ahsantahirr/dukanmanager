import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatVariant = "default" | "primary" | "success" | "warning";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: StatVariant;
}

const variantStyles: Record<StatVariant, string> = {
  default: "from-card to-muted/30",
  primary: "from-primary/10 via-card to-card border-primary/20",
  success: "from-success/10 via-card to-card border-success/20",
  warning: "from-warning/10 via-card to-card border-warning/20",
};

const iconStyles: Record<StatVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border bg-gradient-to-br shadow-sm transition-shadow hover:shadow-md", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
