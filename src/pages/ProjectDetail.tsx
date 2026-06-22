import React from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import EmptyState from "../components/common/EmptyState";
import { useProjects } from "../data/projects";
import { useTasks } from "../data/tasks";
import { useAllocations } from "../data/allocations";
import { calculateMetricSummary } from "../features/analytics/metrics";
import TaskDetailsDialog from "../components/projects/TaskDetailsDialog";
import { formatToJalali } from "../lib/dayjs";
import {
  ArrowRight,
  Briefcase,
  AlertTriangle,
  Layers,
  Activity,
  CheckCircle,
  Clock,
  PieChart,
  User,
  MessagesSquare,
  Search,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "../lib/utils";

const PRIORITY_LABELS: Record<string, { label: string; style: string }> = {
  urgent: { label: "فوری", style: "bg-rose-50 text-rose-800 border-rose-200" },
  high: { label: "بالا", style: "bg-amber-50 text-amber-800 border-amber-200" },
  medium: { label: "متوسط", style: "bg-indigo-50 text-indigo-800 border-indigo-250" },
  low: { label: "پایین", style: "bg-slate-55 text-slate-700 border-slate-200" },
  none: { label: "بدون اولویت", style: "bg-slate-50 text-slate-400 border-slate-100" },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: allocations = [], isLoading: isAllocationsLoading } = useAllocations();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);

  // Find exact project
  const project = React.useMemo(() => {
    return projects.find((p) => p.id === id);
  }, [projects, id]);

  // Filter tasks specific to this project
  const projectTasks = React.useMemo(() => {
    return tasks.filter((t) => t.project_id === id);
  }, [tasks, id]);

  // Handle local text search filtering on tasks
  const filteredTasks = React.useMemo(() => {
    if (!searchTerm.trim()) return projectTasks;
    const term = searchTerm.toLowerCase();
    return projectTasks.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.plane_identifier.toLowerCase().includes(term) ||
        (t.state_name && t.state_name.toLowerCase().includes(term))
    );
  }, [projectTasks, searchTerm]);

  // Project metrics calculation
  const metrics = React.useMemo(() => {
    return calculateMetricSummary(projectTasks);
  }, [projectTasks]);

  // Allocations specific to this project
  const projectAllocations = React.useMemo(() => {
    return allocations.filter((a) => a.project_id === id);
  }, [allocations, id]);

  const totalAgreedHours = React.useMemo(() => {
    return projectAllocations.reduce((sum, item) => sum + (Number(item.agreed_hours) || 0), 0);
  }, [projectAllocations]);

  // Reset pagination when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  
  const paginatedTasks = React.useMemo(() => {
    const begin = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(begin, begin + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const isLoading = isProjectsLoading || isTasksLoading || isAllocationsLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse text-right">
          <div className="h-20 bg-white border border-slate-100 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-100 rounded-3xl" />
            ))}
          </div>
          <div className="h-64 bg-white border border-slate-100 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <EmptyState
          title="پروژه یافت نشد"
          description="برگشت به صفحه مدیریت پروژه جهت بررسی شناسه‌های همگام‌سازی."
          actionText="بازگشت به پروژه‌ها"
          onAction={() => window.history.back()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 text-right" dir="rtl">
        {/* Navigation Breadcrumb & Header */}
        <div className="space-y-3 pb-5 border-b border-slate-100 select-none">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-[color] text-[10px] font-black"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>پروژه‌های دیجیتال آژانس</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={cn("h-4 w-4 rounded-full shrink-0", project.color || "bg-indigo-600")} />
              <div>
                <h1 className="text-xl font-black text-ink flex items-center gap-2">
                  <span>بینش پروژه: {project.name}</span>
                  <span className="font-mono text-xs uppercase text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg select-none">
                    {project.plane_identifier}
                  </span>
                </h1>
                <p className="text-[10px] text-muted-text font-bold mt-1">
                  پروانه برنامه‌ریزی و تعهد ظرفیت برای کارها و دلیوری‌های این پروژه فلو.
                </p>
              </div>
            </div>

            {/* Quick allocation metrics badge */}
            <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl flex items-center gap-4 shrink-0 font-bold max-w-sm">
              <div className="space-y-0.5">
                <span className="text-[8px] text-muted-text block block">ظرفیت توافق‌شده اسپرینت</span>
                <span className="text-xs text-ink font-serif font-black">{totalAgreedHours} ساعت</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top visual metrics cards block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.003)] select-none">
            <div className="p-3 rounded-2xl bg-slate-100 text-slate-800 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-text font-black block">کل کارها</span>
              <p className="text-xl font-bold font-sans text-ink leading-none">{metrics.totalCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.003)] select-none">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-text font-black block">در حال انجام (Started)</span>
              <p className="text-xl font-bold font-sans text-sky-600 leading-none">{metrics.stateDistribution.started}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.003)] select-none">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-text font-black block">تکمیل‌شده (Completed)</span>
              <p className="text-xl font-bold font-sans text-emerald-600 leading-none">{metrics.stateDistribution.completed}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.003)] select-none">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-text font-black block">تأخیر مفرط (Delayed)</span>
              <p className="text-xl font-bold font-sans text-rose-650 leading-none">{metrics.delayedCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main tasks table listing (take 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 select-none">
                <Briefcase className="h-5 w-5 text-slate-800" />
                <h3 className="text-xs font-black text-slate-850">پیمانه مانیتورینگ کارهای پروژه ({projectTasks.length})</h3>
              </div>

              {/* Text filter input */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute right-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="فیلتر متنی تسک‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 text-[10px] font-bold bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>
            </div>

            {/* Custom Interactive Table */}
            <div className="bg-white rounded-3xl border border-slate-100/70 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.003)]">
              {filteredTasks.length === 0 ? (
                <div className="p-16 text-center text-slate-405 flex flex-col items-center select-none space-y-2">
                  <AlertTriangle className="h-6 w-6 text-slate-350 animate-bounce" />
                  <p className="text-[10px] font-bold text-slate-500">موردی برای نمایش یافت نشد.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xxs font-bold divide-y divide-slate-100">
                    <thead className="bg-slate-50 border-b border-slate-150/40 text-[9px] text-muted-text select-none">
                      <tr>
                        <th className="p-3.5">شناسه کار</th>
                        <th className="p-3.5">عنوان کلیدی کار</th>
                        <th className="p-3.5">گروه وضعیت</th>
                        <th className="p-3.5">اولویت</th>
                        <th className="p-3.5">تارگت ددلاین</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedTasks.map((t) => {
                        const prio = PRIORITY_LABELS[t.priority || "none"];
                        return (
                          <tr
                            key={t.id}
                            onClick={() => setSelectedTask(t)}
                            className="hover:bg-slate-50/40 transition-colors cursor-pointer group"
                          >
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-mono text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase">
                                {t.plane_identifier}
                              </span>
                            </td>

                            <td className="p-3.5 max-w-xs md:max-w-sm">
                              <span className="text-slate-800 line-clamp-1 group-hover:text-indigo-650 transition-[color]">
                                {t.name}
                              </span>
                            </td>

                            <td className="p-3.5 whitespace-nowrap">
                              <span className="inline-block text-[9px] px-2 py-0.5 rounded-full border border-slate-150/50 bg-slate-50 text-slate-700 font-bold">
                                {t.state_name}
                              </span>
                            </td>

                            <td className="p-3.5 whitespace-nowrap">
                              <span className={cn("inline-block text-[8px] px-1.5 py-0.5 rounded-md border font-black", prio?.style)}>
                                {prio?.label}
                              </span>
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-muted-text select-none text-[9px]">
                              {t.target_date ? formatToJalali(t.target_date) : "فاقد سررسید"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Simplified Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2 border-t border-slate-100 text-[10px] text-muted-text select-none">
                  <span>صفحه {currentPage} از {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-705 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-705 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar calculations & Allocation cards (take 1 col) */}
          <div className="space-y-6">
            {/* Project manual allocations */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.003)] space-y-4">
              <div className="flex items-center gap-1.5 select-none pb-2 border-b border-slate-100">
                <PieChart className="h-4 w-4 text-slate-655" />
                <h4 className="text-xs font-black text-slate-800">تعهد ساعت‌های اسپرینت</h4>
              </div>

              {projectAllocations.length === 0 ? (
                <p className="text-[10px] text-indigo-500 bg-indigo-50/40 border border-indigo-100/50 px-3 py-2.5 rounded-2xl leading-relaxed text-right">
                  ساعتی برای این پروژه ثبت نشده است. مربی اسکرام می‌تواند با رفتن به زبانه «توزیع ظرفیت»، برای گروه‌های کاری پشتیبانی و خدمات فنی، ساعات توافق‌شده دوره‌ای ثبت کند.
                </p>
              ) : (
                <div className="space-y-3">
                  {projectAllocations.map((a) => (
                    <div
                      key={a.id}
                      className="bg-slate-50 border border-slate-150/40 p-3 rounded-2xl text-[10px] font-bold space-y-1"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-ink font-black">{a.category?.name || "بدون مشخصه"}</span>
                        <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg text-[9px] font-extrabold">{a.agreed_hours} ساعت</span>
                      </div>
                      
                      {a.notes && (
                        <p className="text-[8px] text-muted-text font-medium line-clamp-1">{a.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Project degradation warnings */}
            <div className="bg-slate-50 border border-slate-150 p-5 rounded-3xl space-y-2 select-none">
              <div className="flex items-center gap-1.5 text-slate-800">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <h5 className="text-[10px] font-black">راهنمای تحلیل ظرفیت و ساعات</h5>
              </div>
              <p className="text-[9px] text-muted-text font-bold leading-relaxed">
                از آنجا که اطلاعات برآورد زمانی (Estimate) و کارکرد واقعی (Tracked Hours) به طور مستقیم در گزارش‌های نسخه Plane.so Community خالی می‌باشد، توزیع ظرفیت توافق‌شده در این سایدبار کاملاً مکمل کارهای فعال بوده و هیچگونه ساعت فیک و شبیه‌سازی‌شده‌ای ارائه نمی‌گردد.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Task Details Dialog Modal */}
        <TaskDetailsDialog
          task={selectedTask}
          isOpen={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
        />
      </div>
    </AppShell>
  );
}
