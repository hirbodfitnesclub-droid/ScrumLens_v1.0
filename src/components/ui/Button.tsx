import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, children, disabled, ...props },
    ref
  ) => {
    const baseClass =
      "inline-flex items-center justify-center font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink disabled:opacity-50 disabled:pointer-events-none rounded-full cursor-pointer";

    const variants = {
      primary: "bg-ink text-white hover:bg-black",
      secondary: "bg-muted-light/40 text-ink hover:bg-muted-light/60",
      outline: "border border-muted-light text-ink hover:bg-muted-light/20",
      ghost: "text-ink hover:bg-muted-light/30",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
      accent: "bg-accent text-ink hover:bg-accent-hover font-bold shadow-sm",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-11 px-5 text-sm",
      lg: "h-13 px-7 text-base",
      icon: "h-11 w-11",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseClass, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
