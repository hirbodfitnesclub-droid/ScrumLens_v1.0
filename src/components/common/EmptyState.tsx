import React from "react";
import { Info, LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  id?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  id,
  title,
  description,
  icon: Icon = Info,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/20 max-w-xl mx-auto space-y-4",
        className
      )}
    >
      <div className="p-4 rounded-full bg-slate-100 text-slate-405 flex items-center justify-center">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>

      <div className="space-y-1 select-none">
        <h4 className="font-black text-sm text-slate-800">{title}</h4>
        <p className="text-[11px] text-muted-text font-bold max-w-sm leading-relaxed leading-normal">{description}</p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-[11px] font-black bg-ink text-white rounded-full hover:bg-slate-800 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
