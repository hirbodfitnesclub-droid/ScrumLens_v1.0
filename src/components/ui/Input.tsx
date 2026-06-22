import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 align-right text-right">
        {label && (
          <label className="text-sm font-semibold text-ink antialiased">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-muted-light/60 bg-white px-4 py-2 text-sm text-ink placeholder:text-muted-text/70 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
