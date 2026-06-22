import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppShell from "../components/layout/AppShell";
import KpiCard from "../components/common/KpiCard";
import EmptyState from "../components/common/EmptyState";
import { usePeople } from "../data/people";
import { useTasks } from "../data/tasks";
import { useAllocations } from "../data/allocations";
import { usePersonTeams } from "../data/teams";
import { calculateMetricSummary } from "../features/analytics/metrics";
import TaskDetailsDialog from "../components/projects/TaskDetailsDialog";
import DonutChartCard from "../components/charts/DonutChartCard";
import { formatToJalali } from "../lib/dayjs";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getLocalComments } from "../data/comments";
import {
  ArrowRight,
  User,
  Activity,
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  Search,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";

const PRIORITY_LABELS: Record<string, { label: string; style: string }> = {
  urgent: { label: "فوری", style: "bg-rose-50 text-rose-850 border-rose-100" },
  high: { label: "بالا", style: "bg-amber-50 text-amber-800 border-amber-200" },
  medium: { label: "متوسط", style: "bg-indigo-50 text-indigo-800 border-indigo-150" },
  low: { label: "پایین", style: "bg-slate-50 text-slate-705 border-slate-200" },
  none: { label: "بدون اولویت", style: "bg-slate-50 text-slate-400 border-slate-100" },
};

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: people = [], isLoading: isPeopleLoading } = usePeople();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: allocations = [], isLoading: isAllocationsLoading } = useAllocations();
  const { data: teams = [], isLoading: isTeamsLoading } = usePersonTeams(id || "");

  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);

  // Retrieve exact person
  const person = React.useMemo(() => {
    return people.find((p) => p.id === id);
  }, [people, id]);

  // Tasks assigned to this person (active as assignee)
  const assignedTasks = React.useMemo(() => {
    return tasks.filter((t) => t.assignees?.some((a) => a.id === id));
  }, [tasks, id]);

  // Local filtered search results on assigned tasks
  const filteredTasks = React.useMemo(() => {
    if (!searchTerm.trim()) return assignedTasks;
    const term = searchTerm.toLowerCase();
    return assignedTasks.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.plane_identifier.toLowerCase().includes(term) ||
        (t.state_name && t.state_name.toLowerCase().includes(term))
    );
  }, [assignedTasks, searchTerm]);

  // Handle pagination list
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const paginatedTasks = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const metrics = React.useMemo(() => {
    return calculateMetricSummary(assignedTasks);
  }, [assignedTasks]);

  // Retrieve allocations owned by this person
  const personAllocations = React.useMemo(() => {
    return allocations.filter((a) => a.owners?.some((o) => o.person_id === id));
  }, [allocations, id]);

  // Workload state distribution chart data
  const chartData = React.useMemo(() => {
    const sd = metrics.stateDistribution;
    return [
      { name: "بک‌لاگ", value: sd.backlog, color: "#64748B" },
      { name: "انجام نشده", value: sd.unstarted, color: "#94A3B8" },
      { name: "در جریان", value: sd.started, color: "#3B82F6" },
      { name: "تکمیل‌شده", value: sd.completed, color: "#10B981" },
      { name: "لغو شده", value: sd.cancelled, color: "#EF4444" },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // Fetch comments written by this person
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery<any[]>({
    queryKey: ["person_comments", id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return getLocalComments().filter((c) => c.person_id === id);
      }
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          task:tasks(plane_identifier, name)
        `)
        .eq("person_id", id)
        .order("plane_created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(id),
  });

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const isLoading = isPeopleLoading || isTasksLoading || isAllocationsLoading || isTeamsLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse text-right">
          <div className="h-24 bg-white border border-slate-100 rounded-3xl" />
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

  if (!person) {
    return (
      <AppShell>
        <EmptyState
          title="عضو تیم یافت نشد"
          description="برگشت به صفحه تیم جهت بارگذاری مجدد شناسایی‌ها."
          actionText="بازگشت به همکاران"
          onAction={() => window.history.back()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 text-right" dir="rtl">
        {/* Breadcrumb Navigation & Header */}
        <div className="space-y-3 pb-5 border-b border-slate-100 select-none">
          <Link
            to="/people"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-[color] text-[10px] font-black"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>مدیریت اعضا و همگام‌سازی</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={cn("h-14 w-14 rounded-full font-black text-lg flex items-center justify-center uppercase shadow-inner border border-slate-150/60", person.avatar_color || "bg-indigo-900 text-white")}>
                {person.full_name ? person.full_name.charAt(0) : "؟"}
              </span>

              <div>
                <h1 className="text-xl font-black text-ink flex items-center gap-2.5">
                  <span>ورکلود فردی: {person.full_name}</span>
                  <span className={cn(
                    "text-[10px] font-black px-2.5 py-0.5 rounded-full border leading-none select-none",
                    person.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {person.is_active ? "مشغول به کار" : "غیرفعال"}
                  </span>
                </h1>
                <p className="text-[10px] text-muted-text font-bold mt-1">
                  کاشی تخصیص وظایف، میزان انحراف زمانی و سهمیه فعالیت ظرفیت {person.role_title || "بدون نقش تعریف‌شده"}.
                </p>
              </div>
            </div>

            {/* Associate Teams Badges */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-150 p-3 rounded-2xl select-none">
              <span className="text-[9px] text-slate-500 font-bold block ml-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                تیم‌های همکار:
              </span>
              {teams.length === 0 ? (
                <span className="text-[9px] text-slate-400 font-bold">بدون تیم فعلی</span>
              ) : (
                teams.map((t) => (
                  <span key={t.id} className="text-[9px] font-bold bg-white text-indigo-700 border border-indigo-100 rounded-lg px-2 py-0.5 shadow-sm">
                    {t.name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* General KPI summary values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="کارهای تخصیصی فعال"
            value={metrics.totalCount}
            description="وظایف فعال و جاری در دست اقدام"
            icon={Layers}
            iconBgColor="bg-slate-100"
            iconTextColor="text-slate-850"
          />
          <KpiCard
            title="تحویل‌های کامل‌شده"
            value={metrics.stateDistribution.completed}
            description="تروپوت کارهای تکمیل‌شده و بسته"
            icon={CheckCircle}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
          />
          <KpiCard
            title="تأخیر تسک‌ها"
            value={metrics.delayedCount}
            description="رد ددلاین با وضعیت ناتمام"
            icon={Clock}
            iconBgColor={metrics.delayedCount > 0 ? "bg-rose-50" : "bg-slate-50"}
            iconTextColor={metrics.delayedCount > 0 ? "text-rose-650" : "text-slate-400"}
          />
          <KpiCard
            title="کارهای راکد (Stale)"
            value={metrics.staleCount}
            description="بیش از ۷ روز فاقد به روز رسانی"
            icon={Activity}
            iconBgColor={metrics.staleCount > 0 ? "bg-amber-50" : "bg-slate-50"}
            iconTextColor={metrics.staleCount > 0 ? "text-amber-700" : "text-slate-400"}
          />
        </div>

        {/* Mid-level visual layout (Tasks and visual graphs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main tasks tabular section (take 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 select-none">
                <Briefcase className="h-5 w-5 text-slate-800" />
                <h3 className="text-xs font-black text-slate-850">وظایف و عملیات در جریان ({assignedTasks.length} کار)</h3>
              </div>

              {/* Local mini search filter */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute right-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="سرچ متنی سریع کارهای او..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 text-[10px] font-bold bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>
            </div>

            {/* Tasks table render */}
            <div className="bg-white rounded-3xl border border-slate-100/70 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.003)]">
              {filteredTasks.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center select-none space-y-2">
                  <AlertTriangle className="h-6 w-6 text-slate-350 animate-bounce" />
                  <p className="text-[10px] font-bold text-slate-500">یافت نشد.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xxs font-bold divide-y divide-slate-100">
                    <thead className="bg-slate-50 border-b border-slate-150/40 text-[9px] text-muted-text select-none">
                      <tr>
                        <th className="p-3.5">شناسه</th>
                        <th className="p-3.5">عنوان فعالیت</th>
                        <th className="p-3.5">پروژه ارجاعی</th>
                        <th className="p-3.5">گروه وضعیت</th>
                        <th className="p-3.5">اولویت</th>
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

                            <td className="p-3.5">
                              <span className="text-slate-800 line-clamp-1 group-hover:text-indigo-650 transition-[color]">
                                {t.name}
                              </span>
                            </td>

                            <td className="p-3.5 whitespace-nowrap text-[9px] text-muted-text font-bold">
                              {t.project?.name || "نامشخص"}
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table pagination controller */}
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

          {/* Right visual sidebar (Donut chart & active allocations & comment highlights) */}
          <div className="space-y-6">
            {/* Visual load status donut chart */}
            {chartData.length > 0 && (
              <DonutChartCard
                title="توزیع وضعیت کارها"
                description="توضیح وضعیت پیشرفت دلیوری‌های فردی"
                data={chartData}
                isLoading={isLoading}
              />
            )}

            {/* Custom personal hourly allocations */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.003)] space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-800">تعهد ساعت‌های فردی</h4>
              </div>

              {personAllocations.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-150/40 p-3 rounded-2xl leading-relaxed text-center">
                  ساعت تخصیص مستقیمی در دوره جاری برای او تعریف نشده است. عملکرد او ذیل تیم‌های همکار محاسبه می‌گردد.
                </p>
              ) : (
                <div className="space-y-3">
                  {personAllocations.map((a) => (
                    <div key={a.id} className="bg-slate-50 border border-slate-150/40 p-3 rounded-2xl text-[10px] font-bold space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-800 font-extrabold truncate">{a.project?.name}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-[9px] font-extrabold shrink-0">
                          {a.agreed_hours} ساعت
                        </span>
                      </div>
                      <p className="text-[8px] text-muted-text font-semibold truncate">دسته‌بندی: {a.category?.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline of comments highlights written by this person */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.003)] space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-800">آخرین بازخوردها و فعالیت‌ها</h4>
              </div>

              {isCommentsLoading ? (
                <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
              ) : comments.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-155 p-3 rounded-2xl leading-relaxed text-center">
                  هیچ نظر ثبت‌شده تاریخی در کل بوردها برای او یافت نشد.
                </p>
              ) : (
                <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
                  {comments.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-[9px] font-bold space-y-1 border-r-2 border-indigo-100 pr-2.5">
                      <div className="text-muted-text font-medium leading-none">
                        روی کار <span className="font-mono text-indigo-600 select-none uppercase">{item.task?.plane_identifier}</span>:
                      </div>
                      <p className="text-slate-700 leading-normal line-clamp-2 font-semibold">«{item.body}»</p>
                      <span className="text-[8px] text-slate-400 block font-normal">{formatToJalali(item.plane_created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modular dialog view to review single task details */}
        <TaskDetailsDialog
          task={selectedTask}
          isOpen={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
        />
      </div>
    </AppShell>
  );
}
