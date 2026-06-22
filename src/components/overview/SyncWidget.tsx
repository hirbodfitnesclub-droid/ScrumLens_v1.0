import React from "react";
import { useSyncStatus, usePerformSync } from "../../data/sync";
import { isSupabaseConfigured } from "../../lib/supabase";
import { Cloud, CloudLightning, RefreshCw, CheckCircle, DatabaseZap, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SyncWidget() {
  const { data: summary, isLoading: isChecking, refetch } = useSyncStatus();
  const { mutate: performSync, isPending: isSyncing, error: syncError, isSuccess } = usePerformSync();
  const [showDetails, setShowDetails] = React.useState(false);

  // If Supabase is not configured, show offline-only status indicator
  if (!isSupabaseConfigured) {
    return (
      <div className="bg-slate-50/80 border border-slate-200/60 rounded-3xl p-4 flex items-center justify-between gap-4 text-right">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-700">وضعیت پایگاه داده: آفلاین (محلی)</h4>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              تنظیمات درگاه ابری یافت نشد. تمامی محاسبات و داده‌ها به شکل محلی در مرورگر شما نگهداری می‌شود.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const total = summary?.totalUnsynced || 0;

  const handleSyncClick = () => {
    performSync(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  return (
    <div className="w-full text-right font-sans mb-2 select-none" dir="rtl">
      <AnimatePresence mode="wait">
        {total > 0 ? (
          <motion.div
            key="unsynced-warning"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-50/75 border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-amber-150 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <CloudLightning className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-900">تغییرات محلی آماده همگام‌سازی ابری</h4>
                  <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                    تعداد <span className="font-extrabold text-amber-900 text-sm px-0.5">{total}</span> رکورد داده‌ای جدید به صورت آفلاین ثبت شده و هنوز به سوپابیس منتقل نشده‌اند.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                >
                  {showDetails ? "پنهان‌سازی جزئیات" : "مشاهده تفکیک داده‌ها"}
                </button>
                <button
                  disabled={isSyncing}
                  onClick={handleSyncClick}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition-all cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>در حال انتقال به ابر...</span>
                    </>
                  ) : (
                    <>
                      <DatabaseZap className="h-4 w-4" />
                      <span>همگام‌سازی با سوپابیس</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expansive Details breakdown */}
            {showDetails && summary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-amber-200/50 pt-3 mt-1"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs text-amber-800 font-semibold p-1">
                  {summary.tasksCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.tasksCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">کارها و وظایف</span>
                    </div>
                  )}
                  {summary.peopleCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.peopleCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">کارشناسان</span>
                    </div>
                  )}
                  {summary.teamsCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.teamsCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">گروه‌ها و تیم‌ها</span>
                    </div>
                  )}
                  {summary.allocationsCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.allocationsCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">تخصیص ساعت</span>
                    </div>
                  )}
                  {summary.importsCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.importsCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">درون‌ریزی‌ها</span>
                    </div>
                  )}
                  {summary.commentsCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.commentsCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">کامنت‌ها</span>
                    </div>
                  )}
                  {summary.categoriesCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.categoriesCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">دسته‌های کاری</span>
                    </div>
                  )}
                  {summary.mapsCount > 0 && (
                    <div className="bg-amber-100/50 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-amber-950 text-sm">{summary.mapsCount}</span>
                      <span className="text-[10px] text-amber-700 mt-0.5">نگاشت وضعیت</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {syncError && (
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>خطا در انتقال داده‌ها: {(syncError as any)?.message || "خطای ناشناخته شبکه"}</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="synced-ok"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50/40 border border-emerald-200/50 rounded-3xl p-4 flex items-center justify-between gap-4 text-right shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-emerald-900">اتصال ابری امن و همگام</h4>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  تمامی داده‌ها و محاسبات محلی شما کاملاً با پایگاه داده ابری سوپابیس (Supabase) سینک و ذخیره شده‌اند.
                </p>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isChecking}
              className="p-1.5 hover:bg-emerald-100/80 rounded-xl text-emerald-700 transition-colors cursor-pointer"
              title="بررسی مجدد همگام‌سازی"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
