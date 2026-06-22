import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { usePeople, useUpsertPerson } from "../data/people";
import { useTeams } from "../data/teams";
import { Person } from "../types/domain";
import { Search, UserSquare2, SlidersHorizontal, Users, ShieldAlert, Sparkles, CheckCircle2, UserCheck, UserX, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KpiCard from "../components/common/KpiCard";

export default function People() {
  const { data: people = [], isLoading } = usePeople();
  const { data: teams = [] } = useTeams();
  const { mutate: upsertPerson } = useUpsertPerson();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterActive, setFilterActive] = React.useState<"all" | "active" | "inactive">("all");

  const toggleActiveStatus = (person: Person) => {
    upsertPerson({
      ...person,
      is_active: !person.is_active,
    });
  };

  const filteredPeople = React.useMemo(() => {
    return people.filter((p) => {
      const matchesSearch =
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.role_title && p.role_title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && p.is_active) ||
        (filterActive === "inactive" && !p.is_active);

      return matchesSearch && matchesActive;
    });
  }, [people, searchTerm, filterActive]);

  const kpis = React.useMemo(() => {
    const total = people.length;
    const active = people.filter((p) => p.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [people]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-ink">
              <UserSquare2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink">مدیریت اعضا و همگام‌سازی</h1>
              <p className="text-xs font-semibold text-muted-text">لیست تحلیلگران، برنامه‌نویسان و مجریان پروژه آژانس</p>
            </div>
          </div>
          
          <Link
            to="/settings"
            className="px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 bg-white transition-all shadow-sm cursor-pointer"
          >
            ادغام نام‌ها و ویرایش پیشرفته ←
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-text">کل افراد کشف‌شده</p>
              <h4 className="text-lg font-black text-ink">{kpis.total} نفر</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-text">افراد فعال تیمی</p>
              <h4 className="text-lg font-black text-emerald-600">{kpis.active} نفر</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center font-bold">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-text">افراد غیرفعال / بایگانی</p>
              <h4 className="text-lg font-black text-slate-600">{kpis.inactive} نفر</h4>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50 p-4 rounded-3xl border border-slate-100/60">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-muted-text" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام فرستنده، سمت..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-ink transition-all"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilterActive("all")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${filterActive === "all" ? "bg-ink text-accent shadow-sm" : "bg-white border border-slate-200 hover:border-slate-300 text-slate-700"}`}
            >
              همه اعضا ({people.length})
            </button>
            <button
              onClick={() => setFilterActive("active")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${filterActive === "active" ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 hover:border-slate-300 text-slate-700"}`}
            >
              فقط فعالان ({kpis.active})
            </button>
            <button
              onClick={() => setFilterActive("inactive")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${filterActive === "inactive" ? "bg-slate-700 text-white shadow-sm" : "bg-white border border-slate-200 hover:border-slate-300 text-slate-700"}`}
            >
              بایگانی‌شده ({kpis.inactive})
            </button>
          </div>
        </div>

        {/* Dynamic List Render */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-muted-text">
            <div className="h-5 w-5 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">در حال دریافت لیست افراد فعال...</span>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="p-20 border border-dashed border-slate-200 rounded-3xl text-center text-muted-text space-y-3">
            <UserSquare2 className="h-10 w-10 mx-auto text-slate-300" />
            <h4 className="font-bold text-sm text-slate-700">هیچ فردی یافت نشد</h4>
            <p className="text-xs">نام جستجو شده با کاربران کشف شده در آپلودهای Plane همخوانی ندارد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredPeople.map((person) => {
                const avatarColor = person.avatar_color || "bg-slate-900 text-white";
                return (
                  <motion.div
                    key={person.id}
                    layoutId={`person-card-${person.id}`}
                    className={`bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.008)] p-5 flex flex-col justify-between gap-4 hover:border-slate-200 transition-all ${!person.is_active && "bg-slate-50/40 opacity-75"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-11 w-11 rounded-full font-black text-sm flex items-center justify-center shadow-inner uppercase shrink-0 ${avatarColor}`}>
                          {person.full_name ? person.full_name.charAt(0) : "؟"}
                        </span>
                        
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-ink truncate hover:text-indigo-600 transition-colors">
                            <Link to={`/people/${person.id}`}>{person.full_name}</Link>
                          </h4>
                          <p className="text-xs text-muted-text font-semibold truncate pt-0.5">
                            {person.role_title || "بدون سمت شغلی مشخص"}
                          </p>
                        </div>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => toggleActiveStatus(person)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${person.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 cursor-pointer" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 cursor-pointer"}`}
                        title={person.is_active ? "کلیک برای تغییر به بایگانی" : "کلیک برای فعال‌سازی مجدد"}
                      >
                        {person.is_active ? "فعال" : "بایگانی"}
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-100 text-xs">
                      {person.aliases && person.aliases.length > 0 ? (
                        <span className="text-[10px] text-muted-text font-bold bg-slate-100 px-2.5 py-0.5 rounded-full select-none leading-none">
                          {person.aliases.length} نام مستعار
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">شناسایی مجزا</span>
                      )}

                      <Link
                        to={`/people/${person.id}`}
                        className="flex items-center gap-1 font-bold text-ink hover:text-indigo-600 transition-all group"
                      >
                        <span>پروفایل و ورکلود</span>
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
    </AppShell>
  );
}
