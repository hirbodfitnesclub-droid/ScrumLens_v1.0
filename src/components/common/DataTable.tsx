import React from "react";
import { Task } from "../../types/domain";
import { formatToJalali } from "../../lib/dayjs";
import { Search, Calendar, ChevronLeft, ChevronRight, AlertTriangle, Layers, User, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

const PRIORITY_STYLES = {
  urgent: { label: "فوری", style: "bg-rose-50 text-rose-800 border-rose-200" },
  high: { label: "بسیار بالا", style: "bg-amber-50 text-amber-800 border-amber-200" },
  medium: { label: "متوسط", style: "bg-blue-50 text-blue-800 border-blue-200" },
  low: { label: "پایین", style: "bg-slate-100 text-slate-700 border-slate-200" },
  none: { label: "بدون اولویت", style: "bg-slate-50 text-slate-500 border-slate-100" },
};

const STATE_GROUP_COLORS = {
  backlog: "bg-slate-100 text-slate-800 border-slate-200",
  unstarted: "bg-slate-100 text-slate-700 border-slate-100",
  started: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

interface DataTableProps {
  tasks: Task[];
  pageSize?: number;
}

export default function DataTable({ tasks, pageSize = 12 }: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Apply quick search on already-filtered results
  const searchedTasks = React.useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.plane_identifier.toLowerCase().includes(term) ||
        t.state_name.toLowerCase().includes(term)
    );
  }, [tasks, searchTerm]);

  // Reset pagination when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [tasks, searchTerm]);

  // Pagination calculation
  const totalItems = searchedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const paginatedTasks = React.useMemo(() => {
    const begin = (currentPage - 1) * pageSize;
    const end = begin + pageSize;
    return searchedTasks.slice(begin, end);
  }, [searchedTasks, currentPage, pageSize]);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="فیلتر متنی سریع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-xs font-semibold border border-slate-200 rounded-2xl bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <span className="text-[10px] text-muted-text font-bold bg-slate-50 border border-slate-200/50 px-3 py-1 rounded-full shrink-0">
          نمایش {totalItems} کار یافته شده
        </span>
      </div>

      {/* Table Canvas */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_25px_rgba(0,0,0,0.005)] overflow-hidden">
        {totalItems === 0 ? (
          <div className="p-16 text-center text-muted-text space-y-2 flex flex-col items-center">
            <AlertTriangle className="h-8 w-8 text-slate-300 animate-pulse" />
            <h5 className="font-bold text-xs text-slate-600">هیچ کاری یافت نشد</h5>
            <p className="text-[10px]">هیچ آیتمی مطابق فیلترهای جستجوی شما کشف نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-muted-text">
                  <th className="p-4">شناسه کار</th>
                  <th className="p-4">عنوان فعالیت</th>
                  <th className="p-4">وضعیت فلو</th>
                  <th className="p-4">اولویت</th>
                  <th className="p-4">مسئولین واگذاری</th>
                  <th className="p-4">تاریخ تحویل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {paginatedTasks.map((task) => {
                  const prio = PRIORITY_STYLES[task.priority || "none"];
                  const stateCol = STATE_GROUP_COLORS[task.state_group || "unstarted"];
                  
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* ID tag */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase">
                          {task.plane_identifier}
                        </span>
                      </td>
                      
                      {/* Title & Project name */}
                      <td className="p-4 max-w-xs md:max-w-md">
                        <div className="space-y-0.5">
                          <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors inline-block text-xxs leading-relaxed truncate max-w-[280px]">
                            {task.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", task.project?.color || "bg-indigo-600")} />
                            <span className="text-[9px] text-muted-text font-bold">{task.project?.name || "بدون مشخصه پروژه"}</span>
                          </div>
                        </div>
                      </td>

                      {/* State group and custom name */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold", stateCol)}>
                          {task.state_name}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold", prio.style)}>
                          {prio.label}
                        </span>
                      </td>

                      {/* Assignees stack */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {task.assignees?.map((a) => (
                            <span
                              key={a.id}
                              className={cn("inline-flex items-center gap-1 bg-slate-100 border border-slate-200/50 text-[10px] font-semibold text-slate-700 px-2 py-0.5 rounded-full", a.avatar_color)}
                              title={a.role_title || undefined}
                            >
                              <User className="h-2.5 w-2.5 shrink-0" />
                              <span>{a.full_name}</span>
                            </span>
                          ))}
                          {!task.assignees || task.assignees.length === 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium">فاقد انتصاب</span>
                          ) : null}
                        </div>
                      </td>

                      {/* Target date */}
                      <td className="p-4 whitespace-nowrap text-muted-text font-bold text-[10px]">
                        <div className="flex items-center gap-1 select-none">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{task.target_date ? formatToJalali(task.target_date) : "بدون ددلاین"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginations block footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xxs font-bold text-slate-600">
            <span>صفحه {currentPage} از {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
