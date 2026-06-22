import React from "react";
import { useUiStore } from "../../store/useUiStore";
import { useProjects } from "../../data/projects";
import { usePeople } from "../../data/people";
import { useTeams } from "../../data/teams";
import { SlidersHorizontal, Trash2, CalendarRange, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

const STATE_GROUPS_PERSIAN = [
  { value: "backlog", label: "بک‌لاگ (Backlog)" },
  { value: "unstarted", label: "انجام نشده (Unstarted)" },
  { value: "started", label: "در حال انجام (Started)" },
  { value: "completed", label: "تکمیل شده (Completed)" },
  { value: "cancelled", label: "لغو شده (Cancelled)" },
];

export default function FilterBar() {
  const { filters, setFilter, resetFilters } = useUiStore();
  
  // Queries
  const { data: projects = [] } = useProjects();
  const { data: people = [] } = usePeople();
  const { data: teams = [] } = useTeams();

  const activeProjects = projects.filter(p => p.status === "active");
  const activePeople = people.filter(p => p.is_active);

  const hasActiveFilters = 
    filters.projectId !== null || 
    filters.assigneeId !== null || 
    filters.teamId !== null || 
    filters.stateGroup !== null || 
    filters.startDate !== null || 
    filters.endDate !== null;

  return (
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-800" />
          <h3 className="text-xs font-black text-slate-850">پیکربندی فیلترهای تحلیلی</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>پاک کردن فیلترها</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Project filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-text">پروژه</label>
          <select
            value={filters.projectId || ""}
            onChange={(e) => setFilter("projectId", e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-[11px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">همه پروژه‌ها</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Team filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-text">تیم همکاران</label>
          <select
            value={filters.teamId || ""}
            onChange={(e) => setFilter("teamId", e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-[11px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">همه تیم‌ها</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                تیم {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-text">عضو مسئول</label>
          <select
            value={filters.assigneeId || ""}
            onChange={(e) => setFilter("assigneeId", e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-[11px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">همه همکاران</option>
            {activePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* State group filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-text">دسته وضعیت ستون</label>
          <select
            value={filters.stateGroup || ""}
            onChange={(e) => setFilter("stateGroup", e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-[11px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">همه وضعیت‌ها</option>
            {STATE_GROUPS_PERSIAN.map((sg) => (
              <option key={sg.value} value={sg.value}>
                {sg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-text">از تاریخ (روز/هفته/ماه)</label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => setFilter("startDate", e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        {/* End date */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-text">تا تاریخ</label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => setFilter("endDate", e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
      </div>
    </div>
  );
}
