import { useState, useEffect } from "react";
import { Clock, Calendar, HelpCircle } from "lucide-react";
import { formatToJalali } from "../../lib/dayjs";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../ui/Badge";

export default function Topbar() {
  const { isOffline } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (d: Date) => {
    return d.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-muted-light/60 bg-white/85 backdrop-blur-md px-8 sticky top-0 z-30 shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-extrabold text-ink antialiased">داشبورد تحلیلی اسکرام‌مستر</h2>
        {isOffline && (
          <Badge variant="accent" className="mr-2 text-[10px] font-bold px-2 py-0.5">
            آفلاین / لوکال هاست
          </Badge>
        )}
      </div>

      {/* Clock, calendar and status info */}
      <div className="flex items-center gap-6">
        {/* Date representation */}
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-text">
          <Calendar className="h-4 w-4 text-ink/80" />
          <span>{formatToJalali(time, "dddd D MMMM YYYY")}</span>
        </div>

        {/* Live Clock with space-mono style */}
        <div className="flex items-center gap-2 text-sm font-bold text-ink bg-muted-light/25 rounded-xl px-3.5 py-1.5 border border-muted-light/35 font-mono">
          <Clock className="h-4 w-4 animate-pulse text-accent-content" />
          <span className="tabular-nums select-none" dir="ltr">{formatClock(time)}</span>
        </div>

        {/* Mini Guide */}
        <div className="relative group cursor-help text-muted-text hover:text-ink transition-colors">
          <HelpCircle className="h-5 w-5" />
          <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-ink p-4 text-xs font-semibold text-white leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-muted-light/10 text-right z-50">
            شما با استفاده از دکمه «درون‌ریزی فایل Plane»، می‌توانید خروجی CSV کارهای اسپرینت خود را آپلود کنید تا نمودارها و آمارها با دیتابیس Supabase همگام و تحلیل شوند.
          </div>
        </div>
      </div>
    </header>
  );
}
