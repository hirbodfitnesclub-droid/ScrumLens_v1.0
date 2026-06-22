import React from "react";
import { Link } from "react-router-dom";
import { Project, Task } from "../../types/domain";
import { useUpdateProjectStatus } from "../../data/projects";
import { calculateMetricSummary } from "../../features/analytics/metrics";
import { ChevronLeft, Folder, Archive, CheckCircle, RefreshCcw } from "lucide-react";
import { cn } from "../../lib/utils";

interface ProjectCardProps {
  project: Project;
  projectTasks: Task[];
}

export default function ProjectCard({ project, projectTasks }: ProjectCardProps) {
  const updateStatus = useUpdateProjectStatus();
  
  const m = React.useMemo(() => {
    return calculateMetricSummary(projectTasks);
  }, [projectTasks]);

  const progressPercent = React.useMemo(() => {
    if (m.totalCount === 0) return 0;
    return Math.round((m.stateDistribution.completed / m.totalCount) * 100);
  }, [m]);

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = project.status === "active" ? "archived" : "active";
    updateStatus.mutate({ projectId: project.id, status: newStatus });
  };

  const isActive = project.status === "active";

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.005)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.015)] transition-all flex flex-col justify-between h-full min-h-[220px]",
        !isActive && "opacity-60 bg-slate-50/50"
      )}
    >
      <div className="space-y-4">
        {/* Header Name & Code */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn("h-3 w-3 rounded-full shrink-0", project.color || "bg-indigo-600")} />
            <div className="truncate">
              <h3 className="font-black text-xs text-ink truncate select-none leading-none mb-1">{project.name}</h3>
              <span className="font-mono text-[9px] font-black uppercase text-indigo-500 bg-indigo-50/40 px-1.5 py-0.5 rounded-lg border border-indigo-100/40">
                {project.plane_identifier}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleArchive}
            disabled={updateStatus.isPending}
            className={cn(
              "p-2 rounded-xl border border-slate-150 transition-all text-slate-400 hover:text-slate-700 cursor-pointer hover:bg-slate-50 shrink-0",
              !isActive && "text-rose-600 border-rose-100 hover:bg-rose-50"
            )}
            title={isActive ? "بایگانی پروژه" : "بازگردانی پروژه"}
          >
            {updateStatus.isPending ? (
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-2 border-y border-slate-100/65 py-3 text-right">
          <div className="space-y-0.5">
            <span className="text-[9px] text-muted-text font-bold">کل کارها</span>
            <p className="font-black text-sm text-ink">{m.totalCount}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-muted-text font-bold">در جریان</span>
            <p className="font-black text-sm text-sky-600">{m.stateDistribution.started}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-muted-text font-bold">تکمیل‌شده</span>
            <p className="font-black text-sm text-emerald-600">{m.stateDistribution.completed}</p>
          </div>
        </div>

        {/* Simple Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-bold text-muted-text">
            <span>میزان پیشروی تسک‌ها</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-505 transition-all duration-500 rounded-full bg-emerald-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] text-muted-text font-bold">
          {m.delayedCount > 0 ? (
            <span className="text-rose-600 font-extrabold">{m.delayedCount} کار با تأخیر</span>
          ) : (
            <span className="text-emerald-600">بدون کار معلق</span>
          )}
        </span>

        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition"
        >
          <span>ورود به بینش پروژه</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
