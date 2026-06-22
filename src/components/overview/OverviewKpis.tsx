import React from "react";
import KpiCard from "../common/KpiCard";
import { MetricSummary } from "../../features/analytics/metrics";
import { Layers, Activity, CheckCircle, Clock } from "lucide-react";

interface OverviewKpisProps {
  summary: MetricSummary;
  isLoading?: boolean;
}

export default function OverviewKpis({ summary, isLoading = false }: OverviewKpisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-150 p-6 rounded-3xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard
        title="کل کارهای فعال (Active)"
        value={summary.totalCount}
        description="تعداد کل کارهای ثبت‌شده در مپنگ اصلی"
        icon={Layers}
        iconBgColor="bg-slate-150"
        iconTextColor="text-slate-800"
      />
      <KpiCard
        title="کارهای در جریان (Started)"
        value={summary.stateDistribution.started}
        description="وظایف با گروه وضعیت In Progress"
        icon={Activity}
        iconBgColor="bg-sky-50"
        iconTextColor="text-sky-600"
      />
      <KpiCard
        title="کارهای تکمیل‌شده (Completed)"
        value={summary.stateDistribution.completed}
        description="وظایف با گروه وضعیت Done"
        icon={CheckCircle}
        iconBgColor="bg-emerald-50"
        iconTextColor="text-emerald-600"
      />
      <KpiCard
        title="کارهای دارای تأخیر (Delayed)"
        value={summary.delayedCount}
        description="ددلاین گذشته و وضعیت نامکمل"
        icon={Clock}
        iconBgColor={summary.delayedCount > 0 ? "bg-rose-50" : "bg-slate-50"}
        iconTextColor={summary.delayedCount > 0 ? "text-rose-650" : "text-slate-400"}
      />
    </div>
  );
}
