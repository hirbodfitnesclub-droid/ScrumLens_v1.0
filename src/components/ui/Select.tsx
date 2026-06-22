import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "motion/react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "انتخاب کنید...",
  label,
  className,
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full flex flex-col space-y-1.5 text-right" ref={containerRef}>
      {label && <label className="text-sm font-semibold text-ink">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border border-muted-light/60 bg-white px-4 py-2 text-sm text-ink placeholder:text-muted-text/70 focus:outline-none focus:ring-2 focus:ring-ink transition-all cursor-pointer",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-text transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-muted-light/60 bg-white py-1 shadow-lg top-[100%]"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-text text-center">گزینه‌ای وجود ندارد</div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2.5 text-right text-sm hover:bg-muted-light/20 transition-colors cursor-pointer",
                      isSelected && "font-semibold bg-accent/20"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-ink-800" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
