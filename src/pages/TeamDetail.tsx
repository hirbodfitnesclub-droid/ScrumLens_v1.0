import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useTeamDetail, useAddTeamMember, useRemoveTeamMember } from "../data/teams";
import { usePeople } from "../data/people";
import { useTasks } from "../data/tasks";
import { useAllocations } from "../data/allocations";
import { calculateMetricSummary } from "../features/analytics/metrics";
import KpiCard from "../components/common/KpiCard";
import EmptyState from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  ArrowRight,
  UserPlus,
  UserMinus,
  RefreshCw,
  Layers,
  Users,
  CheckCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  Flame,
  ArrowLeft,
  PieChart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!id) {
      navigate("/teams");
    }
  }, [id, navigate]);

  if (!id) return null;

  // Load backend and spreadsheet resources
  const { data: teamData, isLoading: teamLoading } = useTeamDetail(id);
  const { data: allPeople = [], isLoading: peopleLoading } = usePeople();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: allocations = [], isLoading: allocationsLoading } = useAllocations();

  // Mutations
  const { mutate: addMember, isPending: adding } = useAddTeamMember();
  const { mutate: removeMember, isPending: removing } = useRemoveTeamMember();

  // Selected state
  const [selectedPersonId, setSelectedPersonId] = React.useState("");

  // Custom confirm dialog states
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<{ id: string; name: string } | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || adding) return;
    addMember(
      { teamId: id, personId: selectedPersonId },
      {
        onSuccess: () => {
          setSelectedPersonId("");
        },
      }
    );
  };

  const handleRemoveMember = (personId: string, personName: string) => {
    setMemberToRemove({ id: personId, name: personName });
    setIsConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (memberToRemove) {
      removeMember(
        { teamId: id, personId: memberToRemove.id },
        {
          onSuccess: () => {
            setIsConfirmOpen(false);
            setMemberToRemove(null);
          },
        }
      );
    }
  };

  const isLoading = teamLoading || peopleLoading || tasksLoading || allocationsLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 gap-3 text-muted-text" dir="rtl">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">در حال دریافت و ارزیابی تجمعی جزئیات تیم...</span>
        </div>
      </AppShell>
    );
  }

  if (!teamData) {
    return (
      <AppShell>
        <div className="p-12 text-center text-rose-600 space-y-4" dir="rtl">
          <AlertTriangle className="h-10 w-10 mx-auto text-rose-500 animate-bounce" />
          <h3 className="font-extrabold text-sm">تیم درخواستی موثر کشف نشد!</h3>
          <Link to="/teams" className="text-xs text-ink hover:underline">
            بازگشت به صفحه تیم‌ها
          </Link>
        </div>
      </AppShell>
    );
  }

  const { team, members } = teamData;
  const currentMemberIds = new Set(members.map((m) => m.id));

  // Compute tasks belonging to members in this team
  const teamTasks = tasks.filter((t) =>
    t.assignees?.some((a) => currentMemberIds.has(a.id))
  );

  // Compute overall status summary for the entire team
  const metrics = calculateMetricSummary(teamTasks);

  // Filter team allocations
  const teamAllocations = allocations.filter(
    (a) =>
      a.owners?.some((o) => o.team_id === id) ||
      a.owners?.some((o) => o.person_id && currentMemberIds.has(o.person_id))
  );

  const teamTotalAgreedHours = teamAllocations.reduce(
    (sum, item) => sum + (Number(item.agreed_hours) || 0),
    0
  );

  // Form dropdown options
  const nonMembers = allPeople.filter((p) => p.is_active && !currentMemberIds.has(p.id));

  // Construct individual member workload details for table representation
  const membersMetrics = members.map((member) => {
    const pTasks = tasks.filter((t) => t.assignees?.some((a) => a.id === member.id));
    const pMetrics = calculateMetricSummary(pTasks);
    const pAllocations = allocations.filter((a) =>
      a.owners?.some((o) => o.person_id === member.id)
    );
    const pAgreedHours = pAllocations.reduce((sum, item) => sum + (Number(item.agreed_hours) || 0), 0);

    return {
      member,
      metrics: pMetrics,
      agreedHours: pAgreedHours,
    };
  });

  return (
    <AppShell>
      <div className="space-y-8 text-right" dir="rtl">
        {/* Breadcrumb & Header */}
        <div className="space-y-3 pb-5 border-b border-slate-100 select-none">
          <Link
            to="/teams"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-[color] text-[10px] font-black"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>مدیریت تیم‌های آژانس</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={cn("h-4 w-4 rounded-full border shadow-inner shrink-0", team.color || "bg-indigo-600")} />
              <div>
                <h1 className="text-xl font-black text-ink flex items-center gap-2">
                  <span>پنل ظرفیت تیم: {team.name}</span>
                </h1>
                <p className="text-[10px] text-muted-text font-bold mt-1">
                  {team.description || "بدون توضیحات ثبت‌شده برای کلاستر تیمی."}
                </p>
              </div>
            </div>

            {/* Agreed hour status block */}
            <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl flex items-center gap-4 shrink-0 font-bold max-w-sm">
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-500 block">ساعات توافق شده کل کلاستر</span>
                <span className="text-xs text-ink font-serif font-black">{teamTotalAgreedHours} ساعت</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregated Team KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="کارهای جریانی تیمی"
            value={metrics.totalCount}
            description="مجموع تمام تسک‌های اعضای فعال"
            icon={Layers}
            iconBgColor="bg-slate-100"
            iconTextColor="text-slate-800"
          />
          <KpiCard
            title="تحویل‌های تیمی"
            value={metrics.stateDistribution.completed}
            description="کارهای بسته‌شده کل کلاستر"
            icon={CheckCircle}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
          />
          <KpiCard
            title="کارهای معلق تاخیری"
            value={metrics.delayedCount}
            description="رد ضرب‌الاجل با وضعیت معوق"
            icon={Clock}
            iconBgColor={metrics.delayedCount > 0 ? "bg-rose-50" : "bg-slate-50"}
            iconTextColor={metrics.delayedCount > 0 ? "text-rose-650" : "text-slate-400"}
          />
          <KpiCard
            title="کارت غفلت (Stale)"
            value={metrics.staleCount}
            description="تسک‌های راکد و بدون تغییر اعضا"
            icon={Flame}
            iconBgColor={metrics.staleCount > 3 ? "bg-amber-100/60 animate-pulse" : "bg-slate-50"}
            iconTextColor={metrics.staleCount > 3 ? "text-amber-800 font-extrabold" : "text-slate-500"}
          />
        </div>

        {/* Workload balancing and comparisons section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members compare table (take 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 select-none">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 animate-pulse">
                <Flame className="h-4 w-4 text-amber-500" />
                توازن ظرفیت و بارکاری مابین اعضا
              </span>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full font-black">
                {members.length} متخصص تیمی
              </span>
            </div>

            {membersMetrics.length === 0 ? (
              <div className="p-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-muted-text space-y-2">
                <Users className="h-8 w-8 mx-auto text-slate-350" />
                <h4 className="font-bold text-sm text-slate-600 font-black">هیچ فردی عضو این تیم نیست</h4>
                <p className="text-xs">جهت ثبت تجمعی و محاسبه راندمان کارگزاری، از باکس کناری اولین عضو را بیفزایید.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Comparative grid list */}
                <div className="bg-white rounded-3xl border border-slate-100/80 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.003)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xxs font-bold divide-y divide-slate-100">
                      <thead className="bg-slate-50 border-b border-slate-150/40 text-[9px] text-muted-text select-none">
                        <tr>
                          <th className="p-3.5">همکار متخصص</th>
                          <th className="p-3.5 text-center">کارهای تخصیصی فعال</th>
                          <th className="p-3.5 text-center">کارهای تکمیل‌شده</th>
                          <th className="p-3.5 text-center">ظرفیت توافق‌شده</th>
                          <th className="p-3.5 text-center">وضعیت ریسک بارکاری</th>
                          <th className="p-3.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {membersMetrics.map(({ member, metrics: pMet, agreedHours }) => {
                          const hasRisk = pMet.totalCount > 10;
                          return (
                            <tr key={member.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <span className={cn("h-7.5 w-7.5 rounded-full font-black text-[10px] flex items-center justify-center text-white shrink-0 shadow-inner", member.avatar_color || "bg-slate-800")}>
                                    {member.full_name?.charAt(0)}
                                  </span>
                                  <div>
                                    <Link to={`/people/${member.id}`} className="hover:text-indigo-600 transition-colors text-slate-800 font-extrabold text-[11px] block">{member.full_name}</Link>
                                    <span className="text-[8px] text-slate-400 block mt-0.5 leading-none">{member.role_title || "فنی"}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5 text-center font-mono text-xs text-slate-700">
                                {pMet.totalCount}
                              </td>

                              <td className="p-3.5 text-center font-mono text-xs text-emerald-600">
                                {pMet.stateDistribution.completed}
                              </td>

                              <td className="p-3.5 text-center font-serif text-xs text-indigo-700 font-extrabold">
                                {agreedHours > 0 ? `${agreedHours} ساعت` : "تعریف‌ نشده"}
                              </td>

                              <td className="p-3.5 text-center">
                                {hasRisk ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[8px] border border-rose-100 font-black">
                                    <Flame className="h-2.5 w-2.5 animate-bounce" />
                                    پربار / فرسودگی بالا
                                  </span>
                                ) : pMet.totalCount === 0 ? (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-750 px-2 py-0.5 rounded-md text-[8px] border border-amber-100 font-black">
                                    بدون کار فعال
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[8px] border border-emerald-100 font-black">
                                    نرمال و بهینه
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 text-left">
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.full_name)}
                                  className="p-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="حذف متخصص از گروه"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar form + Team allocations distribution summary */}
          <div className="space-y-6">
            {/* Add member box */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.003)] space-y-4">
              <h3 className="text-xs font-black text-ink flex items-center gap-2 select-none">
                <UserPlus className="h-4 w-4 text-slate-500" />
                <span>افزودن همکار به کلاستر</span>
              </h3>
              <p className="text-[9px] text-muted-text font-bold leading-relaxed">
                هر متخصص جدید با حضور در این تیم به طور خودکار به ترازهای ورکلود تجمعی و محاسبه راندمان اسپرینت‌ها اضافه خواهد شد.
              </p>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-text block select-none">انتخاب شخص</label>
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    disabled={adding}
                    className="w-full px-3 py-2 text-[10px] font-bold border border-slate-150 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="">-- انتخاب فرد فعال تیمی --</option>
                    {nonMembers.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.full_name} ({person.role_title || "بدون سمت شغلی"})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={adding || !selectedPersonId}
                  className="w-full py-2 bg-ink text-accent hover:bg-ink/90 font-black text-[10px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>افزودن عضو جدید</span>
                </button>
              </form>
            </div>

            {/* Team allocations listing */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.003)] space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
                <PieChart className="h-4 w-4 text-slate-500" />
                <h4 className="text-xs font-black text-slate-800">توزیع سهمیه تعهدات کلاستر</h4>
              </div>

              {teamAllocations.length === 0 ? (
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed text-center py-2 bg-slate-50 border border-slate-150 rounded-2xl">
                  تعهدی برای این تیم یا اعضا ثبت نشده است. مربی اسکرام می‌تواند از صفحه ظرفیت، ساعت تخصیص صادر کند.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {teamAllocations.slice(0, 5).map((a) => (
                    <div key={a.id} className="bg-slate-50 border border-slate-150/40 p-3 rounded-2xl text-[9px] font-bold space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-800 font-extrabold truncate">{a.project?.name}</span>
                        <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg font-black shrink-0">
                          {a.agreed_hours} ساعت
                        </span>
                      </div>
                      <p className="text-[7.5px] text-slate-400 font-semibold truncate leading-none">موضوع تعهد: {a.category?.name || "خدمات فنی"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setMemberToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        title="حذف متخصص از گروه"
        description={memberToRemove ? `آیا مطمئن هستید که می‌خواهید "${memberToRemove.name}" را از تیم خارج کنید؟` : ""}
        isLoading={removing}
      />
    </AppShell>
  );
}
