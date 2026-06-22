import React from "react";
import { Task } from "../../types/domain";
import { useTaskComments } from "../../data/comments";
import { useTaskChanges } from "../../data/imports";
import { formatToJalali } from "../../lib/dayjs";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import {
  User,
  Calendar,
  MessageSquare,
  History,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";

interface TaskDetailsDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailsDialog({ task, isOpen, onClose }: TaskDetailsDialogProps) {
  if (!task) return null;

  // React Query queries
  const { data: comments = [], isLoading: isCommentsLoading } = useTaskComments(task.id);
  const { data: changes = [], isLoading: isChangesLoading } = useTaskChanges(task.id);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 select-none mb-1">
            <span className="font-mono text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-lg uppercase">
              {task.plane_identifier}
            </span>
          </div>
          <DialogTitle className="text-sm font-black text-ink leading-relaxed">
            {task.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Main content body (left in RTL, take 2 cols) */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            {/* Context meta or description */}
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-right">
              <span className="text-[10px] text-muted-text font-bold block mb-1">توضیحات و خلاصه وضعیت</span>
              <p className="text-xxs font-semibold text-slate-800 leading-relaxed">
                {task.is_draft ? "این کار به صورت پیش‌نویس (Draft) ثبت شده است." : "کار فعال درون‌ریزی شده از بورد عملیاتی Plane."}
              </p>
            </div>

            {/* Comments block */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 select-none pb-1.5 border-b border-slate-100">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <h4 className="text-xs font-black text-slate-800">گفتگوها و بازخوردها ({comments.length})</h4>
              </div>

              {isCommentsLoading ? (
                <div className="space-y-2 animate-pulse py-2">
                  <div className="h-10 bg-slate-100 rounded-xl" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold py-2">هیچ دیدگاهی برای این کار ثبت نشده است.</p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100/60 text-xxs font-bold">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-indigo-650 font-extrabold flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          {comment.author_name || "همکار نامشخص"}
                        </span>
                        <span className="text-[9px] text-muted-text font-bold">
                          {formatToJalali(comment.plane_created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change logs/Timeline history */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 select-none pb-1.5 border-b border-slate-100">
                <History className="h-4 w-4 text-slate-500" />
                <h4 className="text-xs font-black text-slate-800">تاریخچه همگام‌سازی و تغییرات ({changes.length})</h4>
              </div>

              {isChangesLoading ? (
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ) : changes.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold py-1">تغییر تاریخی در فرآیند آشتی‌دهی ثبت نشده است.</p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {changes.map((log) => (
                    <div key={log.id} className="border-r-2 border-indigo-200 pr-3 py-1 text-[10px] font-bold">
                      <div className="flex items-center gap-2 text-indigo-700 mb-0.5 leading-none">
                        <span>نوع عملیات: {log.change_type === "added" ? "اضافه‌شده" : log.change_type === "updated" ? "به‌روزشده" : "بازگردانی‌ شده"}</span>
                      </div>
                      {log.field_diffs && Object.keys(log.field_diffs).length > 0 && (
                        <div className="text-[9px] text-muted-text mt-1 space-y-0.5 font-medium">
                          {Object.entries(log.field_diffs as Record<string, { from: any; to: any }>).map(([field, diff]) => (
                            <div key={field}>
                              تغییر <span className="font-mono text-cyan-700">{field}</span>: از "
                              <span className="line-through">{String(diff.from || "خالی")}</span>" به "
                              <span className="text-emerald-700 font-bold">{String(diff.to || "خالی")}</span>"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar parameters (right in RTL, take 1 col) */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl space-y-4 h-fit">
            <h5 className="font-black text-xxs text-slate-800 pb-2 border-b border-slate-200/50 select-none">شناسه و پارامترها</h5>

            {/* Assignees list */}
            <div className="space-y-1">
              <span className="text-[9px] text-muted-text font-bold block">مسئولین انتصابی</span>
              <div className="flex flex-wrap gap-1">
                {task.assignees && task.assignees.length > 0 ? (
                  task.assignees.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 bg-white border border-slate-150 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-700">
                      <User className="h-2.5 w-2.5 text-slate-400" />
                      {a.full_name}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold">بدون واگذاری</span>
                )}
              </div>
            </div>

            {/* Priority option */}
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-text font-bold block">اولویت کاری</span>
              <span className="inline-block text-[10px] font-black bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {task.priority === "urgent" ? "فوری" : task.priority === "high" ? "بالا" : task.priority === "medium" ? "متوسط" : task.priority === "low" ? "پایین" : "بدون اولویت"}
              </span>
            </div>

            {/* State Option */}
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-text font-bold block">گروه وضعیت</span>
              <span className="inline-block text-[10px] font-black bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {task.state_name}
              </span>
            </div>

            {/* Timeline info */}
            <div className="space-y-2 border-t border-slate-150 pt-3">
              <div className="flex gap-1.5 items-center text-[10px] text-slate-650 font-bold">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>شروع: {task.start_date ? formatToJalali(task.start_date) : "ثبت نشده"}</span>
              </div>
              <div className="flex gap-1.5 items-center text-[10px] text-slate-650 font-bold">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>پایان: {task.target_date ? formatToJalali(task.target_date) : "ثبت نشده"}</span>
              </div>
            </div>
          </div>
        </div>
    </Dialog>
  );
}
