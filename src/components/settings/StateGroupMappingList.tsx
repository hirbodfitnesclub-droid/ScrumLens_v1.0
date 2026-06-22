import React from "react";
import { useStateGroupMaps, useUpsertStateGroupMap } from "../../data/settings";
import { useTasks } from "../../data/tasks";
import { StateGroup } from "../../types/domain";
import { AlertCircle, CheckCircle2, RefreshCw, Layers } from "lucide-react";
import { motion } from "motion/react";

const STATE_GROUPS: { value: StateGroup; label: string; color: string }[] = [
  { value: "backlog", label: "بکلاگ (Backlog)", color: "bg-slate-100 text-slate-800" },
  { value: "unstarted", label: "شروع‌نشده (Unstarted)", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "started", label: "شروع‌شده / در حال انجام (Started)", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "completed", label: "تکمیل‌شده (Completed)", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "cancelled", label: "لغوشده (Cancelled)", color: "bg-rose-50 text-rose-800 border-rose-200" },
];

export default function StateGroupMappingList() {
  const { data: maps = [], isLoading: mapsLoading } = useStateGroupMaps();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { mutate: upsertMap, isPending: upserting } = useUpsertStateGroupMap();
  const [newCustomState, setNewCustomState] = React.useState("");
  const [newCustomGroup, setNewCustomGroup] = React.useState<StateGroup>("unstarted");

  // Retrieve unique state names inside the actual loaded tasks
  const taskStateNames = React.useMemo(() => {
    const states = new Set<string>();
    tasks.forEach((t) => {
      if (t.state_name) states.add(t.state_name);
    });
    return Array.from(states);
  }, [tasks]);

  // Check which states from tasks have active maps
  const mappedStateNames = React.useMemo(() => {
    return new Set(maps.map((m) => m.state_name));
  }, [maps]);

  const unmappedStatesFromTasks = React.useMemo(() => {
    return taskStateNames.filter((stateName) => !mappedStateNames.has(stateName));
  }, [taskStateNames, mappedStateNames]);

  const handleGroupChange = (stateName: string, group: StateGroup) => {
    upsertMap({ stateName, stateGroup: group });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomState.trim()) return;
    upsertMap({ stateName: newCustomState.trim(), stateGroup: newCustomGroup });
    setNewCustomState("");
  };

  if (mapsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-text">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-sm">در حال بارگذاری نگاشت وضعیت‌ها...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unknown States Warning Warning */}
      {unmappedStatesFromTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">وضعیت‌های ناشناخته کشف شد!</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              تعداد <span className="font-bold">{unmappedStatesFromTasks.length}</span> وضعیت در فایل‌های درون‌ریزی شده شما وجود دارد که هنوز گروه کاری آنها تعریف نشده است و به نامشخص یا شروع‌نشده مپ شده‌اند. لطفاً آنها را مپ کنید:
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {unmappedStatesFromTasks.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setNewCustomState(state);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 text-[11px] font-bold text-amber-800 border border-amber-200 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="h-3 w-3" />
                  <span>{state}</span>
                  <span className="text-amber-500 font-medium">+ افزودن</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Maps Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-muted-text">پیکربندی ستون هواپیما (Plane.so) به مدل استاندارد اسکرام</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {maps.length} وضعیت همگام
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-muted-text">
                  <th className="p-4">نام وضعیت در فایل Plane</th>
                  <th className="p-4">گروه اسکرام متناظر</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {maps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted-text text-xs">
                      هیچ وضعیت مپ شده‌ای وجود ندارد.
                    </td>
                  </tr>
                ) : (
                  maps.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-bold text-ink">
                        <span>{m.state_name}</span>
                        {taskStateNames.includes(m.state_name) && (
                          <span className="mr-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            در حال استفاده
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={m.state_group}
                          disabled={upserting}
                          onChange={(e) => handleGroupChange(m.state_name, e.target.value as StateGroup)}
                          className="px-3 py-1.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                        >
                          {STATE_GROUPS.map((grp) => (
                            <option key={grp.value} value={grp.value}>
                              {grp.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 inline-block" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Custom State Mapping */}
        <div>
          <div className="bg-slate-50/60 border border-slate-100/80 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-ink">افزودن دستی نگاشت جدید</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              اگر وضعیت دیگری در Plane اضافه شده که در این لیست نیست، می‌توانید دستی آن را به مدل اسکرام همگام کنید.
            </p>

            <form onSubmit={handleAddCustom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text block">نام دقیق وضعیت در Plane</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: QA Review یا Needs Edit"
                  value={newCustomState}
                  onChange={(e) => setNewCustomState(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text block">گروه اسکرام متناظر</label>
                <select
                  value={newCustomGroup}
                  onChange={(e) => setNewCustomGroup(e.target.value as StateGroup)}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                >
                  {STATE_GROUPS.map((grp) => (
                    <option key={grp.value} value={grp.value}>
                      {grp.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={upserting || !newCustomState.trim()}
                className="w-full py-2.5 rounded-full bg-ink text-accent hover:bg-ink/95 font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
              >
                افزودن به نگاشت‌ها
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
