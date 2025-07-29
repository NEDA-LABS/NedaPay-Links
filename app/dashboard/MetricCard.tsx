import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { cn } from "@/compliance/user/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className 
}: MetricCardProps) {
  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-subtle border-0 shadow-soft", 
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors p-2 rounded-lg bg-background group-hover:bg-primary/10">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-sm text-muted-foreground font-medium">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={cn(
            "text-sm font-medium flex items-center gap-1",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              trend.isPositive ? "bg-green-500" : "bg-red-500"
            )}></div>
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}