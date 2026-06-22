import React from "react";
import AppShell from "../components/layout/AppShell";
import FilterBar from "../components/common/FilterBar";
import OverviewKpis from "../components/overview/OverviewKpis";
import ProductivityChart from "../components/overview/ProductivityChart";
import ProjectsDistribution from "../components/overview/ProjectsDistribution";
import EmptyState from "../components/common/EmptyState";
import SyncWidget from "../components/overview/SyncWidget";
import { useTasks } from "../data/tasks";
import { useUiStore } from "../store/useUiStore";
import { useTeamDetail } from "../data/teams";
import { filterTasksList } from "../features/analytics/selectors";
import { calculateMetricSummary } from "../features/analytics/metrics";
import { useAuth } from "../hooks/useAuth";
import { formatToJalali } from "../lib/dayjs";
import { LayoutDashboard, Calendar, FileDown, RefreshCw } from "lucide-react";

export default function Overview() {
  const { isOffline } = useAuth();
  const { data: tasks = [], isLoading: isTasksLoading, refetch } = useTasks();
  const { filters } = useUiStore();
  
  // Resolve team members if a team filter is active
  const { data: teamDetails } = useTeamDetail(filters.teamId || "");
  const teamMemberIds = React.useMemo(() => {
    return teamDetails?.members.map((m) => m.id) || [];
  }, [teamDetails]);

  // Compute filtered tasks
  const filteredTasks = React.useMemo(() => {
    return filterTasksList(tasks, filters, teamMemberIds);
  }, [tasks, filters, teamMemberIds]);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    return calculateMetricSummary(filteredTasks);
  }, [filteredTasks]);

  const currentDateFa = React.useMemo(() => {
    return formatToJalali(new Date().toISOString().split("T")[0]);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 text-right" dir="rtl">
        {/* Dynamic Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 select-none">
              <LayoutDashboard className="h-6 w-6 text-ink" />
              <h1 className="text-2xl font-black text-ink">داشبورد بینش اسکرام</h1>
            </div>
            <p className="text-xs text-muted-text font-semibold">
              شناسایی نقاط اصطکاک تحویلی، تخصیص کارآمد منابع آژانس دیجیتال مارکتینگ ScrumLens.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 select-none">
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-150 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              امروز: {currentDateFa}
            </span>
          </div>
        </div>

        {/* Sync Status Banner */}
        <SyncWidget />

        {/* Filter Toolbar */}
        <FilterBar />

        {/* Summary metrics content */}
        {isTasksLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white h-24 rounded-3xl border border-slate-100 p-6" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="هیچ داده اسکرامی یافت نشد"
            description="جهت مشاهده محاسبات تحلیل ظرفیت و بهره‌وری، لطفاً ابتدا خروجی CSV سیستم خود را در صفحه درون‌ریزی بارگذاری نمایید."
          />
        ) : (
          <div className="space-y-8">
            {/* Top KPI values */}
            <OverviewKpis summary={metrics} isLoading={isTasksLoading} />

            {/* Productivity flow */}
            <div className="grid grid-cols-1 gap-8">
              <ProductivityChart tasks={filteredTasks} isLoading={isTasksLoading} />
            </div>

            {/* In-app Project workload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                <h3 className="text-xs font-black text-slate-800">توزیع بارکاری فعال پروژه‌ای</h3>
              </div>
              <ProjectsDistribution tasks={filteredTasks} isLoading={isTasksLoading} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
