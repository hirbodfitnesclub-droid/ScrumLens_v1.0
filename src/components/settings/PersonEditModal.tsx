import React from "react";
import { Person } from "../../types/domain";
import { useUpsertPerson, useMergePeople, usePeople } from "../../data/people";
import { X, Save, Merge, AlertTriangle, HelpCircle, Plus, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface PersonEditModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = [
  { value: "bg-slate-900 text-white", label: "ذغالی" },
  { value: "bg-indigo-600 text-white", label: "نیلی" },
  { value: "bg-emerald-600 text-white", label: "زمردی" },
  { value: "bg-amber-500 text-slate-900", label: "کهربایی" },
  { value: "bg-rose-500 text-white", label: "سرخ" },
  { value: "bg-sky-500 text-white", label: "آسمانی" },
  { value: "bg-violet-600 text-white", label: "بنفش" },
];

export default function PersonEditModal({ person, isOpen, onClose }: PersonEditModalProps) {
  const { data: allPeople = [] } = usePeople();
  const { mutate: upsertPerson, isPending: saving } = useUpsertPerson();
  const { mutate: mergePeople, isPending: merging } = useMergePeople();

  // Controlled states
  const [fullName, setFullName] = React.useState("");
  const [roleTitle, setRoleTitle] = React.useState("");
  const [avatarColor, setAvatarColor] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [aliases, setAliases] = React.useState<string[]>([]);
  const [newAlias, setNewAlias] = React.useState("");
  
  // Merge state
  const [mergeSourceId, setMergeSourceId] = React.useState("");
  const [showMergeConfirm, setShowMergeConfirm] = React.useState(false);

  // Sync inputs with selected person prop
  React.useEffect(() => {
    if (person) {
      setFullName(person.full_name || "");
      setRoleTitle(person.role_title || "");
      setAvatarColor(person.avatar_color || "bg-slate-900 text-white");
      setIsActive(person.is_active ?? true);
      setAliases(person.aliases || []);
      setMergeSourceId("");
      setShowMergeConfirm(false);
    }
  }, [person]);

  if (!isOpen || !person) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    upsertPerson({
      id: person.id,
      full_name: fullName,
      normalized_name: person.normalized_name,
      role_title: roleTitle,
      avatar_color: avatarColor,
      is_active: isActive,
      aliases,
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleAddAlias = () => {
    if (!newAlias.trim()) return;
    if (aliases.includes(newAlias.trim())) return;
    setAliases([...aliases, newAlias.trim()]);
    setNewAlias("");
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases(aliases.filter(a => a !== aliasToRemove));
  };

  const handleMergeSubmit = () => {
    if (!mergeSourceId) return;
    mergePeople({
      primaryId: person.id,
      duplicateId: mergeSourceId,
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  // Filter other people with normalized names for merge options
  const mergeOptions = allPeople.filter(p => p.id !== person.id && p.is_active);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-ink text-sm">ویرایش و ادغام پروفایل فرد</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-muted-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs style content container */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main profile form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 py-2 border-b border-dashed border-slate-100">
              <span className={`h-12 w-12 rounded-full font-black text-base flex items-center justify-center shadow-inner ${avatarColor}`}>
                {fullName ? fullName.charAt(0) : "؟"}
              </span>
              <div>
                <h4 className="font-bold text-sm text-ink">{fullName || "بدون نام"}</h4>
                <p className="text-xs text-muted-text">شناسه‌ فنی: {person.normalized_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text block">نام کامل</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text block">سمت شغلی (Role Title)</label>
                <input
                  type="text"
                  placeholder="مثال: طراح محصول رشد / توسعه‌دهنده"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ink placeholder-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text block">تمِ آواتار</label>
                <select
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  {AVATAR_COLORS.map((col) => (
                    <option key={col.value} value={col.value}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text block">وضعیت فعالیت</label>
                <div className="flex gap-4 items-center h-[38px] px-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-ink focus:ring-ink"
                    />
                    <span>فعال و در دسترس</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Aliases Section */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-muted-text flex items-center gap-1">
                <span>نام‌های مستعار / هم‌پوشان</span>
                <HelpCircle className="h-3 w-3 text-slate-400" title="نام‌های مختلفی که این فرد ممکن است در خروجی Plane داشته باشد" />
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: Alireza Q. / علیرضا"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ink placeholder-slate-300"
                />
                <button
                  type="button"
                  onClick={handleAddAlias}
                  className="px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1.5 min-h-[30px]">
                {aliases.length === 0 ? (
                  <span className="text-[10px] text-muted-text italic">هیچ نام مستعاری افزوده نشده است.</span>
                ) : (
                  aliases.map((alias) => (
                    <span
                      key={alias}
                      className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1 select-none"
                    >
                      <span>{alias}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(alias)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold mr-1 outline-none text-[8px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Form Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-full bg-ink text-accent hover:bg-ink/95 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>بروزرسانی اطلاعات</span>
              </button>
            </div>
          </form>

          {/* Merge panel */}
          <div className="pt-6 border-t border-dashed border-slate-100 space-y-4 bg-rose-50/20 p-4 rounded-3xl border border-rose-100/40">
            <h4 className="text-xs font-black text-rose-800 flex items-center gap-2">
              <Merge className="h-4 w-4" />
              <span>عملیات حیاتی: ادغام شخص دیگر در این پروفایل</span>
            </h4>
            <p className="text-[11px] text-rose-700/80 leading-relaxed">
              اگر این فرد همزمان با چندین نام دیگر در سیستم ثبت شده، می‌توانید شخص دوم را انتخاب کرده و کارها، تعهدات و ارجاع‌های او را به این پروفایل انتقال دهید. شخص دوم بعد از ادغام حذف خواهد شد.
            </p>

            <div className="flex gap-2">
              <select
                value={mergeSourceId}
                onChange={(e) => {
                  setMergeSourceId(e.target.value);
                  setShowMergeConfirm(false);
                }}
                disabled={merging}
                className="flex-1 px-3 py-2 rounded-2xl text-xs font-semibold border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">-- انتخاب فرد دیگر برای حذف و ادغام --</option>
                {mergeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.full_name} ({opt.role_title || "بدون سمت"})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!mergeSourceId) return;
                  setShowMergeConfirm(true);
                }}
                disabled={!mergeSourceId || merging}
                className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                ادغام
              </button>
            </div>

            {showMergeConfirm && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white rounded-2xl border border-rose-200 space-y-3"
              >
                <div className="flex gap-2 text-rose-600">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold leading-relaxed">
                    با کلیک روی دکمه زیر، تمامی تسک‌های منتسب، نظرات، و تعهداتِ فرد انتخاب‌شده به «{fullName}» منتقل خواهد شد و فرد انتخابی به‌طور دائم پاک خواهد شد. این کار غیرقابل بازگشت است!
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMergeConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition-all"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleMergeSubmit}
                    disabled={merging}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-all"
                  >
                    تایید ادغام قطعی
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
