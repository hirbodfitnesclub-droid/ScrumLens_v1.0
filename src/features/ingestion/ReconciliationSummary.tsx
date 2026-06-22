import { ReconciliationResult } from "./reconcile";
import { Badge } from "../../components/ui/Badge";
import { PlusCircle, AlertCircle, Trash2, RotateCcw, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { STATE_GROUP_LABELS } from "../../config/stateGroups";

interface ReconciliationSummaryProps {
  result: ReconciliationResult;
}

export default function ReconciliationSummary({ result }: ReconciliationSummaryProps) {
  const { added, updated, removed, restored, unchanged } = result;
  const [openSection, setOpenSection] = useState<string | null>("added");

  const toggleSection = (sect: string) => {
    setOpenSection(openSection === sect ? null : sect);
  };

  const statItems = [
    { id: "added", label: "کارهای جدید", count: added.length, color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: PlusCircle },
    { id: "updated", label: "تغییر یافته", count: updated.length, color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertCircle },
    { id: "removed", label: "حذف نرم (سافت)", count: removed.length, color: "text-rose-600 bg-rose-50 border-rose-200", icon: Trash2 },
    { id: "restored", label: "بازگردانی شده", count: restored.length, color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: RotateCcw },
    { id: "unchanged", label: "بدون تغییر", count: unchanged.length, color: "text-slate-500 bg-slate-50 border-slate-200", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => toggleSection(item.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer select-none ${item.color} ${
                openSection === item.id ? "ring-2 ring-ink ring-offset-2 scale-[1.02] shadow-sm font-bold" : "hover:opacity-85"
              }`}
            >
              <Icon className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-semibold">{item.label}</span>
              <span className="text-xl font-black mt-1 font-mono">{item.count}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion detail */}
      <div className="bg-slate-50/50 rounded-2xl border border-muted-light/60 overflow-hidden divide-y divide-muted-light/40">
        
        {/* added list */}
        {openSection === "added" && (
          <div className="p-5">
            <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              <span>لیست کارهای جدید شناسایی‌شده ({added.length} کارهای نو)</span>
            </h4>
            {added.length === 0 ? (
              <p className="text-xs text-muted-text">هیچ کار جدیدی در فایل یافت نشد.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {added.map((task) => (
                  <div key={task.plane_identifier} className="flex items-center justify-between p-3 bg-white rounded-xl border border-muted-light/40 shadow-sm text-xs">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="accent" className="font-mono text-[10px]">{task.plane_identifier}</Badge>
                      <span className="font-medium text-ink max-w-sm truncate">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-text font-semibold">{task.project_name}</span>
                      <span className="text-[10px] text-muted-text bg-slate-100 rounded-md px-1.5 py-0.5">{STATE_GROUP_LABELS[task.state_group]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* updated list */}
        {openSection === "updated" && (
          <div className="p-5">
            <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>لیست کارهای دگرگون‌شده ({updated.length} کار)</span>
            </h4>
            {updated.length === 0 ? (
              <p className="text-xs text-muted-text">هیچ تغییری در کارهای ثبت‌شده شناسایی نشد.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {updated.map((item) => (
                  <div key={item.task.plane_identifier} className="p-3 bg-white rounded-xl border border-muted-light/40 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">{item.task.plane_identifier}</Badge>
                        <span className="font-bold text-ink truncate max-w-sm">{item.task.name}</span>
                      </div>
                      <span className="text-muted-text font-semibold">{item.task.project_name}</span>
                    </div>

                    {/* Field differences breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {Object.entries(item.fieldDiffs).map(([field, diff]) => {
                        const d = diff as { from: any; to: any };
                        return (
                          <div key={field} className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-100">
                            <span className="text-muted-text font-medium">{field}</span>
                            <div className="flex items-center gap-1 font-medium select-none" dir="ltr">
                              <span className="text-red-600 line-through truncate max-w-[80px]">{d.from || "خالی"}</span>
                              <span>←</span>
                              <span className="text-emerald-600 font-bold truncate max-w-[80px]">{d.to || "خالی"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* removed list */}
        {openSection === "removed" && (
          <div className="p-5">
            <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-500" />
              <span>لیست کارهای حذف‌شده از فایل ({removed.length} کار)</span>
            </h4>
            {removed.length === 0 ? (
              <p className="text-xs text-muted-text">هیچ کاری در این همگام‌سازی حذف نمی‌شود.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-[11px] mb-2 font-semibold">
                  نکته حفاظتی: این کارها به شکل فیزیکی حذف نخواهند شد، بلکه وضعیت همگام‌سازی آن‌ها به «حذف‌شده (deleted)» تغییر پیدا می‌کند تا تاریخچه آمار دست نخورده باقی بماند.
                </div>
                {removed.map((task) => (
                  <div key={task.plane_identifier} className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="secondary" className="font-mono text-[10px] line-through">{task.plane_identifier}</Badge>
                      <span className="font-medium line-through truncate max-w-sm">{task.name}</span>
                    </div>
                    <span className="text-xs bg-slate-200 rounded px-1.5 py-0.5">وضعیت: {task.state_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* restored list */}
        {openSection === "restored" && (
          <div className="p-5">
            <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-indigo-500" />
              <span>کارهای کاندید بازگردانی از زباله‌دان ({restored.length} کار)</span>
            </h4>
            {restored.length === 0 ? (
              <p className="text-xs text-muted-text">هیچ کاری برای بازگردانی مجدد یافت نشد.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {restored.map((task) => (
                  <div key={task.plane_identifier} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="font-mono border-indigo-200 text-[10px]">{task.plane_identifier}</Badge>
                      <span className="font-medium text-ink max-w-sm truncate">{task.name}</span>
                    </div>
                    <span className="text-[10px] text-indigo-700 bg-indigo-100 rounded px-1.5 py-0.5">احیا مجدد کدهای قبلی</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* unchanged list */}
        {openSection === "unchanged" && (
          <div className="p-5">
            <h4 className="text-sm font-bold text-ink mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              <span>کارهای یکسان بدون تغییر شناسایی‌شده ({unchanged.length} کار)</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              این کارها دارای اطلاعات کاملاً مشابهی بوده و برای افزایش کارایی، پایگاه‌داده دست‌کاری نخواهد شد.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
