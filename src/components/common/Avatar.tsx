import React from "react";
import { cn } from "../../lib/utils";

interface AvatarProps {
  id?: string;
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({ id, name, color = "bg-slate-200 text-slate-700", size = "md", className }: AvatarProps) {
  // Get initials (up to 2 letters or first letter/word)
  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs font-bold",
    lg: "h-12 w-12 text-base font-black",
  };

  return (
    <div
      id={id}
      className={cn(
        "rounded-full flex items-center justify-center font-sans tracking-tighter shrink-0 select-none overflow-hidden",
        sizeClasses[size],
        color.startsWith("bg-") ? color : "bg-slate-100 text-slate-700", // Safe fallback
        className
      )}
      style={!color.startsWith("bg-") ? { backgroundColor: color, color: "#fff" } : undefined}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
}
