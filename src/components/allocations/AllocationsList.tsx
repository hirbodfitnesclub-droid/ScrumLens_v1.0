import React from "react";
import { useAllocations, useDeleteAllocation } from "../../data/allocations";
import { Trash2, AlertCircle, CalendarRange, Clock, User, Users, FolderDot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface AllocationsListProps {
  selectedPeriod: string;
}

export default function AllocationsList({ selectedPeriod }: AllocationsListProps) {
  const { data: allocations = [], isLoading } = useAllocations(selectedPeriod);
  const { mutate: deleteAlloc, isPending: deleting } = useDeleteAllocation();

  // Custom confirm dialog states
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [allocationToDelete, setAllocationToDelete] = React.useState<{ id: string; projectName: string; catName: string } | null>(null);

  const handleDeleteClick = (id: string, projectName: string, catName: string) => {
    setAllocationToDelete({ id, projectName, catName });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (allocationToDelete) {
      deleteAlloc(allocationToDelete.id, {
        onSuccess: () => {
          setIsConfirmOpen(false);
          setAllocationToDelete(null);
        }
      });
    }
  };

  const totalHours = React.useMemo(() => {
    return allocations.reduce((sum, item) => sum + (Number(item.agreed_hours) || 0), 0);
  }, [allocations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-text bg-white border border-slate-100 rounded-3xl">
        <div className="h-4 w-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs">در حال بارکردن تعهدات ماهیانه...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mini Aggregation Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-3xl border border-slate-100/60 gap-4">
        <div>
          <h4 className="text-xs font-black text-slate-800">خلاصه تعهدات ماه {selectedPeriod}</h4>
          <p className="text-xxs text-muted-text mt-0.5">توزیع ساعات مقرر خدمات برای پروژه‌های فعال آژانس</p>
        </div>

        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-xxs text-muted-text font-bold block">مجموع ساعات قراردادها</span>
            <span className="text-lg font-black text-indigo-600 count-number">{totalHours} ساعت</span>
          </div>
          <div className="text-right">
            <span className="text-xxs text-muted-text font-bold block">تعداد تخصیص‌ها</span>
            <span className="text-lg font-black text-slate-800">{allocations.length} دسته</span>
          </div>
        </div>
      </div>

      {/* Allocation List Table */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_25px_rgba(0,0,0,0.005)] overflow-hidden">
        {allocations.length === 0 ? (
          <div className="p-16 text-center text-muted-text space-y-2 flex flex-col items-center">
            <CalendarRange className="h-8 w-8 text-slate-300 animate-pulse" />
            <h5 className="font-bold text-xs text-slate-600">هیچ تعهدی برای این دوره تنظیم نشده است</h5>
            <p className="text-[10px]">شما می‌توانید ظرفیت‌ها را از فرم جانبی برای این دوره مادی تنظیم کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-muted-text">
                  <th className="p-4">پروژه آژانس</th>
                  <th className="p-4">دسته فعالیت</th>
                  <th className="p-4">ساعت متعهد</th>
                  <th className="p-4">مالکان و مسئولان</th>
                  <th className="p-4">توضیحات قرارداد</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                <AnimatePresence initial={false}>
                  {allocations.map((alloc) => (
                    <motion.tr
                      key={alloc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${alloc.project?.color || "bg-indigo-600"}`} />
                          <span className="font-black text-slate-900">{alloc.project?.name || "نامشخص"}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium uppercase mr-1">
                            {alloc.project?.plane_identifier}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {alloc.category?.name || "دسته نامشخص"}
                      </td>
                      <td className="p-4 font-black text-indigo-600 text-sm">
                        {alloc.agreed_hours} ساعت
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {/* Owner team badges */}
                          {alloc.owners?.map((owner) => {
                            if (owner.team_id && owner.team) {
                              return (
                                <span
                                  key={owner.id}
                                  className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                >
                                  <Users className="h-2.5 w-2.5 text-indigo-500" />
                                  <span>تیم {owner.team.name}</span>
                                </span>
                              );
                            }
                            if (owner.person_id && owner.person) {
                              return (
                                <span
                                  key={owner.id}
                                  className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                >
                                  <User className="h-2.5 w-2.5 text-slate-500" />
                                  <span>{owner.person.full_name}</span>
                                </span>
                              );
                            }
                            return null;
                          })}
                          {!alloc.owners || alloc.owners.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">فاقد مالک مستقیم</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 text-muted-text font-semibold max-w-[155px] truncate">
                        {alloc.notes || "-"}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          disabled={deleting}
                          onClick={() => handleDeleteClick(alloc.id, alloc.project?.name || "", alloc.category?.name || "")}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                          title="حذف تخصیص"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setAllocationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="حذف تعهد ماهانه"
        description={allocationToDelete ? `آیا مطمئن هستید که تعهد "${allocationToDelete.catName}" در پروژه "${allocationToDelete.projectName}" را حذف کنید؟` : ""}
        isLoading={deleting}
      />
    </div>
  );
}
