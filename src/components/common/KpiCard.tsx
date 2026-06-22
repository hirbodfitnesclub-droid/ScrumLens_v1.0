import React from "react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  className?: string;
}

export default function KpiCard({
  id,
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconBgColor = "bg-accent/10",
  iconTextColor = "text-accent",
  className,
}: KpiCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.005)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.015)] transition-all flex items-start justify-between min-w-0 select-none",
        className
      )}
    >
      <div className="space-y-2 min-w-0 flex-1">
        <p className="text-[11px] font-bold text-muted-text truncate">{title}</p>
        <h4 className="text-3xl font-black text-ink tracking-tight font-sans leading-none">{value}</h4>
        
        {trend && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-lg border",
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-100"
              )}
            >
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-[9px] text-muted-text font-bold leading-none">{trend.label}</span>
            )}
          </div>
        )}

        {description && !trend && (
          <p className="text-[10px] text-muted-text font-semibold leading-relaxed line-clamp-1">{description}</p>
        )}
      </div>

      {Icon && (
        <div className={cn("p-3.5 rounded-2xl shrink-0 flex items-center justify-center mr-3", iconBgColor)}>
          <Icon className={cn("h-5 w-5", iconTextColor)} />
        </div>
      )}
    </div>
  );
}
