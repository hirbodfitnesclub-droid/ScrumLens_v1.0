import React from "react";
import { useWorkCategories, useCreateWorkCategory, useDeleteWorkCategory } from "../../data/settings";
import { Briefcase, Trash2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export default function WorkCategoriesList() {
  const { data: categories = [], isLoading } = useWorkCategories();
  const { mutate: createCategory, isPending: creating } = useCreateWorkCategory();
  const { mutate: deleteCategory, isPending: deleting } = useDeleteWorkCategory();
  const [newName, setNewName] = React.useState("");

  // Custom confirm dialog states
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<{ id: string; name: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    createCategory(newName.trim());
    setNewName("");
  };

  const handleDeleteClick = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id, {
        onSuccess: () => {
          setIsConfirmOpen(false);
          setCategoryToDelete(null);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-text">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-sm">در حال بارگذاری دسته‌های کاری...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Categories List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-bold text-muted-text">لیست دسته‌های کاری برای قراردادها و ساعت توافق‌شده</span>
          <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
            {categories.length} دسته مستقل
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
          <ul className="divide-y divide-slate-50 p-0 m-0 list-none">
            {categories.length === 0 ? (
              <li className="p-12 text-center text-muted-text text-sm flex flex-col items-center gap-2">
                <Briefcase className="h-8 w-8 text-slate-300" />
                <span>هیچ دسته کاری تعریف نشده است.</span>
              </li>
            ) : (
              <AnimatePresence initial={false}>
                {categories.map((cat, index) => (
                  <motion.li
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-between items-center p-4 hover:bg-slate-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-ink">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm text-ink">{cat.name}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteClick(cat.id, cat.name)}
                      disabled={deleting}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors group cursor-pointer"
                      title="حذف دسته"
                    >
                      <Trash2 className="h-4 w-4 transition-transform group-hover:scale-105" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            )}
          </ul>
        </div>
      </div>

      {/* Add Category Form */}
      <div>
        <div className="bg-slate-50/60 border border-slate-100/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-sm font-black text-ink">افزودن دسته کاری جدید</h3>
          <p className="text-xs text-muted-text leading-relaxed">
            جهت تخصیص ظرفیت تیمی و محاسبه تعهدات ماهانه، نام دسته‌ای متناسب با تخصص یا فعالیت‌ها ایجاد کنید.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-text block">عنوان دسته</label>
              <input
                type="text"
                required
                placeholder="مثال: طراحی محصول رشد یا توسعه دیتابیس"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-ink transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="w-full py-2.5 rounded-full bg-ink text-accent hover:bg-ink/95 font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>افزودن دسته</span>
            </button>
          </form>

          <div className="p-3 bg-blue-50/50 border border-blue-100/40 rounded-2xl flex gap-2 items-start text-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              دسته‌های کاری تعریف شده به عنوان گزینه‌های تخصیص در زبانه «تعهدات و ظرفیت» به کار گرفته خواهند شد.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="حذف دسته کاری"
        description={categoryToDelete ? `آیا مطمئن هستید که می‌خواهید دسته کاری "${categoryToDelete.name}" را حذف کنید؟` : ""}
        isLoading={deleting}
      />
    </div>
  );
}
