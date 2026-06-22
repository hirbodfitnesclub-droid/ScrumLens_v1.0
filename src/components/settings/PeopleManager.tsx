import React from "react";
import { usePeople } from "../../data/people";
import { Person } from "../../types/domain";
import { Search, UserSquare2, ShieldAlert, Edit2, CheckCircle2, EyeOff, UserPlus } from "lucide-react";
import PersonEditModal from "./PersonEditModal";
import { motion, AnimatePresence } from "motion/react";

const AVATAR_COLORS = [
  "bg-slate-900 text-white",
  "bg-indigo-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-500 text-slate-900",
  "bg-rose-500 text-white",
  "bg-sky-500 text-white",
  "bg-violet-600 text-white"
];

export default function PeopleManager() {
  const { data: people = [], isLoading } = usePeople();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Filter people list by search term
  const filteredPeople = React.useMemo(() => {
    if (!searchTerm.trim()) return people;
    const cleanSearch = searchTerm.trim().toLowerCase();
    return people.filter(p => 
      p.full_name.toLowerCase().includes(cleanSearch) || 
      (p.role_title && p.role_title.toLowerCase().includes(cleanSearch)) ||
      (p.aliases && p.aliases.some(a => a.toLowerCase().includes(cleanSearch)))
    );
  }, [people, searchTerm]);

  const handleEditClick = (person: Person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-text">
        <div className="h-5 w-5 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">در حال بارگذاری لیست افراد تیمی...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and summary header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-muted-text" />
          <input
            type="text"
            placeholder="جستجوی نام، نقش، نام مستعار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-ink transition-all"
          />
        </div>

        <div className="flex gap-4">
          <div className="text-xs font-bold text-muted-text">
            کل افراد سیستم: <span className="text-ink font-extrabold">{people.length} نفر</span>
          </div>
          <div className="text-xs font-bold text-muted-text">
            افراد فعال: <span className="text-emerald-600 font-extrabold">{people.filter(p => p.is_active).length} نفر</span>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {filteredPeople.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 rounded-3xl text-center text-muted-text text-sm space-y-2">
          <UserSquare2 className="h-10 w-10 mx-auto text-slate-300" />
          <p>هیچ فردی متناسب با جستجوی شما یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredPeople.map((person) => {
              const color = person.avatar_color || "bg-slate-900 text-white";
              return (
                <motion.div
                  key={person.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`bg-white rounded-3xl border ${person.is_active ? 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]' : 'border-slate-100 bg-slate-50/20 opacity-80'} p-5 flex items-start justify-between gap-3 hover:border-slate-200 transition-all`}
                >
                  <div className="flex items-start gap-3">
                    {/* User initial avatar */}
                    <span className={`h-11 w-11 rounded-full font-black text-sm flex items-center justify-center shrink-0 uppercase shadow-inner ${color}`}>
                      {person.full_name ? person.full_name.charAt(0) : "؟"}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-ink truncate md:max-w-[120px]">{person.full_name}</span>
                        {person.is_active ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100">فعال</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            <EyeOff className="h-2.5 w-2.5" /> غیرفعال
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-text font-medium truncate">
                        {person.role_title || "بدون سمت شغلی مشخص"}
                      </p>

                      {person.aliases && person.aliases.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] text-slate-500 font-medium">مستعار:</span>
                          {person.aliases.slice(0, 2).map((alias, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 border border-slate-200/50 text-slate-600 px-1.5 py-0.2 rounded-full font-medium">
                              {alias}
                            </span>
                          ))}
                          {person.aliases.length > 2 && (
                            <span className="text-[9px] text-muted-text font-bold">
                              +{person.aliases.length - 2} مورد دیگر
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditClick(person)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100/80 hover:text-ink transition-colors cursor-pointer shrink-0"
                    title="ویرایش معلومات یا ادغام"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Profile Editor Modal Sheet */}
      <PersonEditModal
        person={selectedPerson}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
