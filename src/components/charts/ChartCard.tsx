import React from "react";
import { RefreshCw, BarChart2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  description,
  isLoading = false,
  isEmpty = false,
  className,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.008)] flex flex-col justify-between min-h-[300px]",
        className
      )}
    >
      {/* Title & Info */}
      <div className="space-y-1 mb-4 select-none">
        <h3 className="font-black text-sm text-ink">{title}</h3>
        {description && <p className="text-[10px] text-muted-text font-semibold">{description}</p>}
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 relative min-h-[220px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-muted-text text-xs">
            <RefreshCw className="h-5 w-5 animate-spin text-ink" />
            <span>در حال ترسیم نمودار...</span>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
            <BarChart2 className="h-8 w-8 text-slate-300 animate-pulse" />
            <span>داده‌های ثبت‌شده برای تحلیل کافی نیست.</span>
          </div>
        ) : (
          <div className="w-full h-full text-right" dir="ltr">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
