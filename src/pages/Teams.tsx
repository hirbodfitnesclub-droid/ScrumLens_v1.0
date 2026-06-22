import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useTeams, useCreateTeam, useDeleteTeam } from "../data/teams";
import { Team } from "../types/domain";
import { Users, Plus, Trash2, ChevronLeft, Calendar, Layout, FolderKanban, MessageSquare, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const TEAM_COLORS = [
  { value: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/60 bg-indigo-600", label: "نیلی" },
  { value: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60 bg-emerald-600", label: "زمردی" },
  { value: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/60 bg-amber-500", label: "کهربایی" },
  { value: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/60 bg-rose-600", label: "سرخ" },
  { value: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/60 bg-purple-600", label: "بنفش" },
  { value: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100/60 bg-sky-500", label: "آسمانی" },
  { value: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60 bg-slate-900", label: "ذغالی" },
];

export default function Teams() {
  const { data: teams = [], isLoading } = useTeams();
  const { mutate: createTeam, isPending: creating } = useCreateTeam();
  const { mutate: deleteTeam, isPending: deleting } = useDeleteTeam();

  // New team form states
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [colorClass, setColorClass] = React.useState("bg-indigo-600");

  // Custom confirm dialog states
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [teamToDelete, setTeamToDelete] = React.useState<{ id: string; name: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    createTeam({
      name: name.trim(),
      description: description.trim(),
      color: colorClass,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setColorClass("bg-indigo-600");
      }
    });
  };

  const handleDeleteClick = (id: string, teamName: string) => {
    setTeamToDelete({ id, name: teamName });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete.id, {
        onSuccess: () => {
          setIsConfirmOpen(false);
          setTeamToDelete(null);
        }
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-ink">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">مدیریت تیم‌ها</h1>
            <p className="text-xs font-semibold text-muted-text">ایجاد تیم‌های چندتخصصی و پیکربندی ظرفیت عملیاتی هر ماژول آژانس</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Teams list */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-text bg-white border border-slate-100 rounded-3xl">
                <div className="h-5 w-5 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">در حال بارگذاری لیست تیم‌ها...</span>
              </div>
            ) : teams.length === 0 ? (
              <div className="p-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-muted-text space-y-3">
                <Users className="h-10 w-10 mx-auto text-slate-300" />
                <h4 className="font-bold text-sm text-slate-700">هیچ تیمی ساخته نشده است</h4>
                <p className="text-xs leading-relaxed">برای تجمیع ورکلودها و نمایش در گزارش‌ها، اولین تیم خود را از بخش کناری بسازید.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {teams.map((team) => {
                    // Match visual styling based on team color bg code
                    const matchingColorObj = TEAM_COLORS.find(c => c.value.includes(team.color || "")) || TEAM_COLORS[0];
                    const [themeBg, themeBorder, themeText] = matchingColorObj.value.split(" ");
                    
                    return (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.008)] p-5 flex flex-col justify-between gap-5 hover:border-slate-200 hover:shadow-md transition-all h-[180px]"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={cn("h-3.5 w-3.5 rounded-full shrink-0 border shadow-inner", team.color || "bg-indigo-600")} />
                              <h3 className="font-black text-sm text-ink truncate">{team.name}</h3>
                            </div>
                            
                            <button
                              disabled={deleting}
                              onClick={() => handleDeleteClick(team.id, team.name)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="حذف تیم"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <p className="text-xs text-muted-text font-semibold line-clamp-2 leading-relaxed">
                            {team.description || "بدون توضیحات ویژه برای این تیم."}
                          </p>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-dashed border-slate-100">
                          <Link
                            to={`/teams/${team.id}`}
                            className="flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors group"
                          >
                            <span>مدیریت اعضای تیم</span>
                            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Create Team Form Panel */}
          <div>
            <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-3xl space-y-4">
              <h3 className="text-sm font-black text-ink">ساخت تیم جدید</h3>
              <p className="text-xs text-muted-text leading-relaxed">
                اعضای کشف‌شده در Plane را در کلاسترهای مختلف چیده تا تعهدات ماهانه و ظرفیت ورکلود هر تیم را مجزا محاسبه کنیم.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-text block">نام تیم</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تیم توسعه بک‌اند یا دیزاینرها"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-text block">توضیحات کوتاه</label>
                  <textarea
                    placeholder="اهداف یا سرویس‌های تحت پوشش تیم..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-ink transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-text block">رنگ ممیز تیم</label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_COLORS.map((col) => {
                      const isActive = colorClass === col.value.split(" ").slice(-1)[0];
                      const actualColorClass = col.value.split(" ").slice(-1)[0];
                      return (
                        <button
                          key={col.label}
                          type="button"
                          onClick={() => setColorClass(actualColorClass)}
                          className={cn(
                            "h-5 w-5 rounded-full border transition-all cursor-pointer",
                            actualColorClass,
                            isActive ? "ring-2 ring-offset-2 ring-ink scale-110" : "scale-100 hover:scale-105"
                          )}
                          title={col.label}
                        />
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="w-full py-2.5 rounded-full bg-ink text-accent hover:bg-ink/95 font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>ایجاد تیم</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setTeamToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="حذف تیم"
        description={teamToDelete ? `آیا مطمئن هستید که می‌خواهید تیم "${teamToDelete.name}" را حذف کنید؟ این فعالیت تمامی عضویت‌ها را نیز باطل می‌کند.` : ""}
        isLoading={deleting}
      />
    </AppShell>
  );
}
