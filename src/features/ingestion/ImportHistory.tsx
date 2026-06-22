import { useImports } from "../../data/imports";
import { formatToJalali } from "../../lib/dayjs";
import { History, FileSpreadsheet, Layers, Loader2, Plus, AlertCircle, Trash } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export default function ImportHistory() {
  const { data: imports, isLoading } = useImports();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!imports || imports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border border-dashed border-muted-light rounded-3xl bg-white text-center gap-2">
        <History className="h-8 w-8 text-muted-text" />
        <p className="text-sm font-bold text-ink">تاریخچه درون‌ریزی وجود ندارد</p>
        <p className="text-xs text-muted-text font-semibold">تاکنون فایلی همگام‌سازی نشده است تا در این لیست بایگانی شود.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-right">
      {imports.map((item) => {
        const summary = item.summary || { added: 0, updated: 0, removed: 0, restored: 0 };
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-muted-light/50 hover:shadow-sm transition-all text-xs"
          >
            {/* Left information */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-muted-text shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-ink-800" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-ink max-w-[200px] sm:max-w-xs truncate" dir="ltr">{item.file_name}</h4>
                <div className="flex items-center gap-2 text-[10px] text-muted-text font-semibold">
                  <span>فرستاده شده در:</span>
                  <span className="font-bold">{formatToJalali(item.imported_at, "YYYY/MM/DD HH:mm")}</span>
                  <span>•</span>
                  <span>تعداد ردیف: {item.row_count}</span>
                </div>
              </div>
            </div>

            {/* Right statistics breakdown list */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-100 font-bold font-mono">
                <Plus className="h-3.5 w-3.5" />
                <span>{summary.added}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg text-amber-850 border border-amber-100 font-bold font-mono">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{summary.updated}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-lg text-rose-800 border border-rose-100 font-bold font-mono">
                <Trash className="h-3.5 w-3.5" />
                <span>{summary.removed}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
