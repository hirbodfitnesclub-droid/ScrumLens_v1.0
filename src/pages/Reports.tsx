import React from "react";
import AppShell from "../components/layout/AppShell";
import { useProjects } from "../data/projects";
import { usePeople } from "../data/people";
import { useTasks } from "../data/tasks";
import { useAllocations } from "../data/allocations";
import { useTeams } from "../data/teams";
import { calculateMetricSummary } from "../features/analytics/metrics";
import { exportToCSV, exportToExcel, ExcelSheetData } from "../utils/exportUtils";
import { formatToJalali } from "../lib/dayjs";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Briefcase,
  PieChart,
} from "lucide-react";
import { cn } from "../lib/utils";

type ReportType = "executive" | "capacity" | "performance";

export default function Reports() {
  const { data: projects = [] } = useProjects();
  const { data: people = [] } = usePeople();
  const { data: tasks = [] } = useTasks();
  const { data: allocations = [] } = useAllocations();
  const { data: teams = [] } = useTeams();

  const [activeReport, setActiveReport] = React.useState<ReportType>("executive");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("all");

  // Filter tasks based on selected project
  const analyzedTasks = React.useMemo(() => {
    if (selectedProjectId === "all") return tasks;
    return tasks.filter((t) => t.project_id === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const globalMetrics = React.useMemo(() => {
    return calculateMetricSummary(analyzedTasks);
  }, [analyzedTasks]);

  // Aggregate project data for reports
  const projectSummaries = React.useMemo(() => {
    return projects.map((p) => {
      const pTasks = tasks.filter((t) => t.project_id === p.id);
      const metrics = calculateMetricSummary(pTasks);
      const pAllocations = allocations.filter((a) => a.project_id === p.id);
      const agreedHours = pAllocations.reduce((sum, item) => sum + (Number(item.agreed_hours) || 0), 0);

      return {
        ...p,
        metrics,
        agreedHours,
      };
    });
  }, [projects, tasks, allocations]);

  // Aggregate team comparisons
  const teamSummaries = React.useMemo(() => {
    return teams.map((team) => {
      const storedMembers = localStorage.getItem("scrumlens_offline_team_members");
      const localMemberships = storedMembers ? JSON.parse(storedMembers) : [];
      
      const memberIds = localMemberships
        .filter((m: any) => m.team_id === team.id)
        .map((m: any) => m.person_id);

      const teamMembersTasks = tasks.filter((t) =>
        t.assignees?.some((a) => memberIds.includes(a.id))
      );

      const metrics = calculateMetricSummary(teamMembersTasks);
      return {
        ...team,
        memberCount: memberIds.length,
        metrics,
      };
    });
  }, [teams, tasks]);

  // Excel Excel Sheets Generation
  const handleExportExcel = () => {
    const sheets: ExcelSheetData[] = [];

    // 1. Executive Summary Sheet
    sheets.push({
      sheetName: "خلاصه مدیریتی",
      data: [
        { "شاخص عملکرد": "کل کارهای همگام‌سازی شده", "مقدار": globalMetrics.totalCount },
        { "شاخص عملکرد": "کارهای تکمیل‌شده", "مقدار": globalMetrics.stateDistribution.completed },
        { "شاخص عملکرد": "کارهای در حال جریان", "مقدار": globalMetrics.stateDistribution.started },
        { "شاخص عملکرد": "کارهای با تعویق زمانی", "مقدار": globalMetrics.delayedCount },
        { "شاخص عملکرد": "کارهای راکد", "مقدار": globalMetrics.staleCount },
      ],
    });

    // 2. Project List Sheet
    sheets.push({
      sheetName: "جزئیات پروژه‌ها",
      data: projectSummaries.map((p) => ({
        "نام پروژه": p.name,
        "شناسه پروژه": p.plane_identifier,
        "وضعیت پروژه": p.status === "active" ? "فعال" : "بایگانی شده",
        "تعداد کل کارهای ثبت‌شده": p.metrics.totalCount,
        "کارهای تکمیل‌شده": p.metrics.stateDistribution.completed,
        "ساعت تعهدی اسپرینت": p.agreedHours,
      })),
    });

    // 3. People List Sheet
    sheets.push({
      sheetName: "ظرفیت و تروپوت اعضا",
      data: people.map((person) => {
        const pTasks = tasks.filter((t) => t.assignees?.some((a) => a.id === person.id));
        const m = calculateMetricSummary(pTasks);
        return {
          "نام متخصص": person.full_name,
          "سمت شغلی": person.role_title || "فنی",
          "وضعیت همکاری": person.is_active ? "فعال" : "غیرفعال",
          "تعداد کارهای تخصیص یافته": m.totalCount,
          "تعداد فرآیندهای تکمیل شده": m.stateDistribution.completed,
          "کارهای تاخیری": m.delayedCount,
          "کارهای راکد": m.staleCount,
        };
      }),
    });

    exportToExcel(sheets, `ScrumLens_Full_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // CSV Sheet Export
  const handleExportCSV = () => {
    const pData = projectSummaries.map((p) => ({
      projectName: p.name,
      identifier: p.plane_identifier,
      totalTasks: p.metrics.totalCount,
      completedTasks: p.metrics.stateDistribution.completed,
      startedTasks: p.metrics.stateDistribution.started,
      delayedTasks: p.metrics.delayedCount,
      agreedHours: p.agreedHours,
    }));
    exportToCSV(pData, `ScrumLens_Project_Summary_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // Browser Print Document
  const handlePrint = () => {
    window.print();
  };

  const todayFa = formatToJalali(new Date().toISOString().split("T")[0]);

  return (
    <AppShell>
      <div className="space-y-6 text-right" dir="rtl">
        {/* Page Head */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-650" />
              <h1 className="text-2xl font-black text-ink">گزارش‌دهی و خروجی اکسل/PDF</h1>
            </div>
            <p className="text-xs text-muted-text font-semibold">
              طراحی، سفارشی‌سازی و صدور اطلاعات اسکرام، تخصیص ظرفیت و برخط کردن دلیوری‌های دوره.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* CSV Trigger */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] cursor-pointer flex items-center gap-1.5 shadow-sm transition"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              خروجی CSV پروژه‌ها
            </button>

            {/* Excel Sheet trigger */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-950 text-accent hover:bg-slate-800 font-black text-[10px] cursor-pointer flex items-center gap-1.5 shadow-md transition"
            >
              <Download className="h-3.5 w-3.5" />
              خروجی کامل Excel
            </button>
          </div>
        </div>

        {/* Templates Selection & Scope filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
          {/* Menu selectors */}
          <div className="md:col-span-1 bg-slate-50 border border-slate-150 p-4 rounded-3xl h-fit space-y-4 select-none">
            <span className="text-[9px] text-slate-400 font-bold block pb-1 border-b border-slate-200">الگوهای گزارش پیش‌ساخته</span>
            
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveReport("executive")}
                className={cn(
                  "w-full text-right py-2 px-3 rounded-2xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-between",
                  activeReport === "executive"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-150 hover:bg-slate-150/40 text-slate-700"
                )}
              >
                <span>خلاصه اجرایی هفتگی/ماهانه</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveReport("capacity")}
                className={cn(
                  "w-full text-right py-2 px-3 rounded-2xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-between",
                  activeReport === "capacity"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-150 hover:bg-slate-150/40 text-slate-700"
                )}
              >
                <span>تراز ظرفیت و تخصیص ساعت</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveReport("performance")}
                className={cn(
                  "w-full text-right py-2 px-3 rounded-2xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-between",
                  activeReport === "performance"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-150 hover:bg-slate-150/40 text-slate-700"
                )}
              >
                <span>رتبه‌بندی و راندمان کارگزاری</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scope dropdown if needed */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200/60 font-semibold">
              <label className="text-[9px] text-muted-text font-bold block">محدوده گزارش‌پذیری</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[9px] font-bold border border-slate-150 rounded-xl bg-white focus:outline-none"
              >
                <option value="all">تمام پروژه‌ها</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Printable visual card container */}
          <div className="md:col-span-3 space-y-4">
            {/* Live print controller */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl select-none">
              <span>پیش‌نمایش زنده سند گزارشگیری</span>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-xl text-[10px] transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                چاپگر / ذخیره به PDF
              </button>
            </div>

            {/* Premium Document Paper with custom inline styling for high-quality printing */}
            <div
              id="printable-report"
              className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-8 min-h-[600px] border border-slate-300 relative print:p-8 print:border-0 print:shadow-none font-sans"
            >
              {/* Report Header */}
              <div className="flex items-start justify-between border-b pb-5 select-none">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                    ScrumLens SM Insights
                  </span>
                  <h2 className="text-sm font-black text-ink">
                    {activeReport === "executive" && "خلاصه اجرایی تروپوت هفتگی/ماهانه"}
                    {activeReport === "capacity" && "تراز تعهد ظرفیت و توزیع ساعت‌های دیجیتال"}
                    {activeReport === "performance" && "رتبه‌بندی بهره‌وری و کلاسترهای کارگزاری"}
                  </h2>
                  <p className="text-[9px] text-muted-text font-bold">نمای وضعیت آماری دلیوری مستخرج از Plane.so CE</p>
                </div>

                <div className="text-left space-y-1 text-[8px] text-slate-400 font-bold">
                  <div>تاریخ گزارش دلیوری: {todayFa}</div>
                  <div>سیستم تحلیلی: ScrumLens v1.0</div>
                </div>
              </div>

              {/* TEMPLATE 1: Executive weekly/monthly status */}
              {activeReport === "executive" && (
                <div className="space-y-6">
                  {/* Executive Summary card */}
                  <div className="bg-slate-50/70 rounded-2xl border border-slate-150 p-4 space-y-2 select-none">
                    <span className="text-[10px] font-black text-slate-700 block">یادداشت تحلیل مربی اسکرام (Executive Memo):</span>
                    <p className="text-xxs leading-relaxed text-slate-550 font-bold">
                      بنا به سنجش ناشی از سیستم‌های ردیابی وظایف، هم‌اکنون در پورتفولیوی پروژه‌های ذیل آژانس دیجیتال مارکتینگ، تعداد {globalMetrics.totalCount} فعالیت بازرسی‌شده جریان دارد. سهم کارهای تمام شده {globalMetrics.stateDistribution.completed} مورد بوده و {globalMetrics.delayedCount} کار همچنان با رد شدن از تارگت ددلاین تیمی، به عنوان معوقه و ریسک در نظر گرفته می‌شوند.
                    </p>
                  </div>

                  {/* Summary grid stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-white rounded-2xl border border-slate-150 select-none">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">کل کارهای دوره</span>
                      <p className="text-sm font-black text-slate-800">{globalMetrics.totalCount}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-slate-150 select-none">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">تکمیل‌شده</span>
                      <p className="text-sm font-black text-emerald-600">{globalMetrics.stateDistribution.completed}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-slate-150 select-none">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">در حال انجام</span>
                      <p className="text-sm font-black text-sky-600">{globalMetrics.stateDistribution.started}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-slate-150 select-none">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">تاخیری معوق</span>
                      <p className="text-sm font-black text-rose-600">{globalMetrics.delayedCount}</p>
                    </div>
                  </div>

                  {/* Table with Project-specific breakdown */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-700 block select-none">توزیع و تحویل‌های تفکیکی پروژه‌ها</span>
                    <div className="overflow-hidden border border-slate-150 rounded-2xl">
                      <table className="w-full text-xxs font-bold divide-y divide-slate-100">
                        <thead className="bg-slate-50 text-[9px] text-muted-text select-none text-right">
                          <tr>
                            <th className="p-2.5">نام پروژه فعال</th>
                            <th className="p-2.5 text-center">شاخص کار</th>
                            <th className="p-2.5 text-center">تکمیل شده</th>
                            <th className="p-2.5 text-center">معوقات تاخیری</th>
                            <th className="p-2.5 text-center">ساعات تعهدی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-right leading-relaxed font-semibold">
                          {projectSummaries.slice(0, 8).map((p) => (
                            <tr key={p.id}>
                              <td className="p-2.5">{p.name}</td>
                              <td className="p-2.5 text-center font-mono text-[10px]">{p.metrics.totalCount}</td>
                              <td className="p-2.5 text-center font-mono text-[10px] text-emerald-600">{p.metrics.stateDistribution.completed}</td>
                              <td className="p-2.5 text-center font-mono text-[10px] text-rose-600">{p.metrics.delayedCount}</td>
                              <td className="p-2.5 text-center font-serif text-[10px] text-slate-700">{p.agreedHours} ساعت</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: Resource Allocation Capacities */}
              {activeReport === "capacity" && (
                <div className="space-y-6">
                  <div className="bg-emerald-50 text-emerald-800 p-4 border border-emerald-100 rounded-2xl select-none flex gap-2 text-xxs font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="leading-relaxed font-semibold">
                      این ترازنامه به طور مستقیم ظرفیت ساعات توافق‌شده (Agreed Hours) ذیل ردیف خدمات فنی و کارهای عملیاتی Plane.so CE را مقایسه می‌کند. مربی اسکرام می‌تواند با تحلیل بار توازن ساعت‌های پروژه‌ای به تساوی بهره‌وری دپارتمانی نظارت داشته باشد.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-700 block select-none">جزئیات موافقت‌نامه‌های فعال با مشتریان</span>
                    <div className="overflow-hidden border border-slate-150 rounded-2xl">
                      <table className="w-full text-xxs font-bold divide-y divide-slate-100">
                        <thead className="bg-slate-50 text-[9px] text-muted-text select-none text-right">
                          <tr>
                            <th className="p-2.5">ردیف پروژه دیجیتال</th>
                            <th className="p-2.5">تخصص/دسته پشتیبانی</th>
                            <th className="p-2.5 text-center">ساعات صادر شده متعهد</th>
                            <th className="p-2.5">توضیحات تکمیلی اسکرام</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-right font-medium">
                          {allocations.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 font-bold font-sans">هیچ ساعت تعهدی تخصیص در سیستم ثبت نشده است.</td>
                            </tr>
                          ) : (
                            allocations.slice(0, 10).map((a) => (
                              <tr key={a.id}>
                                <td className="p-2.5 font-bold text-slate-800">{a.project?.name}</td>
                                <td className="p-2.5">{a.category?.name || "خدمات فنی"}</td>
                                <td className="p-2.5 text-center font-serif text-[10px] text-indigo-700 font-extrabold">{a.agreed_hours} ساعت</td>
                                <td className="p-2.5 text-[8px] text-slate-400 truncate max-w-xs">{a.notes || "تعهد عملیاتی مصوب"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: Team performance comparison */}
              {activeReport === "performance" && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 text-indigo-800 p-4 border border-indigo-150/40 rounded-2xl select-none text-xxs font-bold space-y-1">
                    <span className="font-black block">نقشه حرارتی کلاسترهای تیمی:</span>
                    <p className="leading-relaxed font-semibold">
                      مقایسه بهره‌وری کلاسترها با محاسبه نسبت کارهای تحویل‌شده و تروپوت کل هر تیم متخصص.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-700 block select-none">رتبه کلاسترها و تروپوت تیمی</span>
                    <div className="overflow-hidden border border-slate-150 rounded-2xl">
                      <table className="w-full text-xxs font-bold divide-y divide-slate-100">
                        <thead className="bg-slate-50 text-[9px] text-muted-text select-none text-right">
                          <tr>
                            <th className="p-2.5">تیم فنی/دپارتمان</th>
                            <th className="p-2.5 text-center">اعضای متخصص فعال</th>
                            <th className="p-2.5 text-center">کل کارهای جاری</th>
                            <th className="p-2.5 text-center">کارهای تکمیل شده</th>
                            <th className="p-2.5 text-center">تأخیرها</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-right leading-relaxed font-medium">
                          {teamSummaries.map((team) => (
                            <tr key={team.id}>
                              <td className="p-2.5 font-bold text-slate-800">{team.name}</td>
                              <td className="p-2.5 text-center font-mono text-[10px]">{team.memberCount} نفر</td>
                              <td className="p-2.5 text-center font-mono text-[10px]">{team.metrics.totalCount}</td>
                              <td className="p-2.5 text-center font-mono text-[10px] text-emerald-650">{team.metrics.stateDistribution.completed}</td>
                              <td className="p-2.5 text-center font-mono text-[10px] text-rose-600">{team.metrics.delayedCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Printable footer watermark */}
              <div className="pt-6 border-t text-[8px] text-slate-400 flex justify-between select-none">
                <span>تولید شده توسط ScrumLens — سامانه پایش و برخط‌سازی ظرفیت آژانس</span>
                <span>امضا اسکرام مستر: ___________________________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
