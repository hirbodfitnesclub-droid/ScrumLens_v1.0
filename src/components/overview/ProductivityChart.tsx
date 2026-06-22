import React from "react";
import { Task } from "../../types/domain";
import { getThroughputStatistics } from "../../features/analytics/metrics";
import LineChartCard from "../charts/LineChartCard";
import BarChartCard from "../charts/BarChartCard";
import { Tabs } from "../ui/Tabs";
import { CalendarRange, Activity } from "lucide-react";

interface ProductivityChartProps {
  tasks: Task[];
  isLoading?: boolean;
}

export default function ProductivityChart({ tasks, isLoading = false }: ProductivityChartProps) {
  const [timeUnit, setTimeUnit] = React.useState<"week" | "month">("month");

  const chartData = React.useMemo(() => {
    const stats = getThroughputStatistics(tasks, timeUnit);
    return stats.map((s) => ({
      name: s.period,
      value: s.count,
    }));
  }, [tasks, timeUnit]);

  const tabsList = React.useMemo(() => [
    { id: "month", label: "به تفکیک ماه میلادی" },
    { id: "week", label: "به تفکیک هفته" }
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 select-none">
          <Activity className="h-4 w-4 text-emerald-650" />
          <h4 className="text-xs font-black text-slate-800">نرخ کارایی و بهره‌وری تیم‌ها</h4>
        </div>
        
        <Tabs
          tabs={tabsList}
          activeTab={timeUnit}
          onChange={(val) => setTimeUnit(val as "week" | "month")}
        />
      </div>

      {timeUnit === "month" ? (
        <BarChartCard
          title="تروپوت ماهانه (کارهای تکمیل‌شده)"
          description="روند کلی تحویل‌ها در بازه زمانی ماه‌ها"
          data={chartData}
          isLoading={isLoading}
          barColor="#111111"
        />
      ) : (
        <LineChartCard
          title="تروپوت هفتگی (کارهای تکمیل‌شده)"
          description="سرعت تحویل کارها با جزئیات هفتگی"
          data={chartData}
          isLoading={isLoading}
          lineColor="#C9F24D"
        />
      )}
    </div>
  );
}
