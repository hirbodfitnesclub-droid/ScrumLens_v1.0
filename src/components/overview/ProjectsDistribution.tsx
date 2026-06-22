import React from "react";
import { Task } from "../../types/domain";
import { getTasksByProject } from "../../features/analytics/metrics";
import DonutChartCard from "../charts/DonutChartCard";
import { Briefcase } from "lucide-react";
import { cn } from "../../lib/utils";

interface ProjectsDistributionProps {
  tasks: Task[];
  isLoading?: boolean;
}

export default function ProjectsDistribution({ tasks, isLoading = false }: ProjectsDistributionProps) {
  const projectStats = React.useMemo(() => {
    return getTasksByProject(tasks);
  }, [tasks]);

  const chartData = React.useMemo(() => {
    // Generate distinct colors
    const COLORS = ["#111111", "#C9F24D", "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#14B8A6"];
    return projectStats
      .filter((p) => p.totalCount > 0)
      .map((p, index) => ({
        name: p.projectName,
        value: p.totalCount,
        color: COLORS[index % COLORS.length],
      }));
  }, [projectStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <DonutChartCard
          title="توزیع کارهای فعال بین پروژه‌ها"
          description="سهم هر پروژه دیجیتال از کل ورکلود جاری آژانس"
          data={chartData}
          isLoading={isLoading}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.005)] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 select-none">
            <Briefcase className="h-4 w-4 text-slate-800" />
            <h4 className="text-xs font-black text-slate-850">پروژه‌های در دست اقدام</h4>
          </div>

          <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto pr-1">
            {projectStats.length === 0 ? (
              <p className="text-[10px] text-muted-text text-center py-8">پروژه‌ای یافت نشد</p>
            ) : (
              projectStats.map((p, index) => {
                const colorObj = chartData.find((cd) => cd.name === p.projectName);
                const barColor = colorObj?.color || "#e2e8f0";
                
                return (
                  <div key={p.projectId} className="py-2.5 flex items-center justify-between gap-4 text-xxs font-bold">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="text-slate-800 truncate" title={p.projectName}>
                        {p.projectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-150/40 px-1.5 py-0.5 rounded-lg text-[9px] uppercase">
                        {p.projectIdentifier}
                      </span>
                      <span className="text-ink font-black">{p.totalCount} کار</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
