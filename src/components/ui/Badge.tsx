import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info" | "accent";
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseClass =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variants = {
    default: "bg-ink text-white",
    secondary: "bg-muted-light/60 text-ink",
    outline: "border border-muted-light text-ink",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    accent: "bg-accent/30 text-ink/90 border border-accent",
  };

  return <span className={cn(baseClass, variants[variant], className)} {...props} />;
}
