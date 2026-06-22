import React from "react";
import AppShell from "../components/layout/AppShell";
import AllocationForm from "../components/allocations/AllocationForm";
import AllocationsList from "../components/allocations/AllocationsList";
import { CalendarCheck, ShieldAlert, AlertCircle, FileSpreadsheet, Sparkles } from "lucide-react";
import dayjs from "dayjs";

export default function Allocations() {
  // Setup default month to current year-month
  const currentMonthStr = dayjs().format("YYYY-MM");
  const [selectedPeriod, setSelectedPeriod] = React.useState(currentMonthStr);

  // Generate some monthly options for the dropdown (e.g. past 2 months, current month, next 4 months)
  const periodOptions = React.useMemo(() => {
    const list = [];
    for (let i = -2; i <= 4; i++) {
      const m = dayjs().add(i, "month");
      list.push({
        value: m.format("YYYY-MM"),
        label: m.format("MMMM YYYY"), // example: June 2026
      });
    }
    return list;
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header content */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-ink">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink">تعهدات و ظرفیت‌های دوره‌ای</h1>
              <p className="text-xs font-semibold text-muted-text">برنامه‌ریزی ساعات متعهد شده هر ماژول یا کار گروهی با آژانس</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-muted-text pr-1">دوره برنامه‌ریزی:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Informative alert explaining Scrum master boundaries */}
        <div className="p-4 bg-amber-50/60 border border-amber-200/50 rounded-3xl flex gap-3 text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <h4 className="font-bold text-amber-950">نکته بسیار مهم در تفکیک داده‌های ظرفیت:</h4>
            <p className="font-medium text-amber-900/90">
              داده‌های خروجی Plane Community فاقد ثبت مجرای ساعت واقعی کاری (Time tracked) هستند. به همین دلیل، توزیع ظرفیت‌های توافق‌شده (ثبت دستی شما در این صفحه) به عنوان<b>«تعهدات قراردادی و برنامه‌ریزی ظرفیت پذیرش پروژه»</b>شکل می‌گیرد و نباید با ساعت کارکرد واقعی کارمندان اشتباه یا مقایسه مستقیم شود.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main List */}
          <div className="lg:col-span-2">
            <AllocationsList selectedPeriod={selectedPeriod} />
          </div>

          {/* Creation Form */}
          <div>
            <AllocationForm selectedPeriod={selectedPeriod} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
