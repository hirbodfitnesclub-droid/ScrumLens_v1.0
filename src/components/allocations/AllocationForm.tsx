import React from "react";
import { useProjects } from "../../data/projects";
import { useWorkCategories } from "../../data/settings";
import { usePeople } from "../../data/people";
import { useTeams } from "../../data/teams";
import { useUpsertAllocation } from "../../data/allocations";
import { Calendar, Clock, Plus, RefreshCw, AlertCircle, Save } from "lucide-react";
import { cn } from "../../lib/utils";

interface AllocationFormProps {
  selectedPeriod: string;
}

export default function AllocationForm({ selectedPeriod }: AllocationFormProps) {
  const { data: projects = [], isLoading: projsLoading } = useProjects();
  const { data: categories = [], isLoading: catsLoading } = useWorkCategories();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { mutate: upsertAllocation, isPending: submutting } = useUpsertAllocation();

  // Selected values
  const [projectId, setProjectId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [agreedHours, setAgreedHours] = React.useState<number | "">("");
  const [notes, setNotes] = React.useState("");

  // Owner selections
  const [selectedPersonIds, setSelectedPersonIds] = React.useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<string[]>([]);

  const handlePersonCheckbox = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPersonIds([...selectedPersonIds, id]);
    } else {
      setSelectedPersonIds(selectedPersonIds.filter(item => item !== id));
    }
  };

  const handleTeamCheckbox = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTeamIds([...selectedTeamIds, id]);
    } else {
      setSelectedTeamIds(selectedTeamIds.filter(item => item !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !categoryId || agreedHours === "" || submutting) return;

    upsertAllocation({
      project_id: projectId,
      category_id: categoryId,
      agreed_hours: Number(agreedHours),
      period_month: selectedPeriod,
      notes: notes.trim(),
      owner_person_ids: selectedPersonIds,
      owner_team_ids: selectedTeamIds,
    }, {
      onSuccess: () => {
        setProjectId("");
        setCategoryId("");
        setAgreedHours("");
        setNotes("");
        setSelectedPersonIds([]);
        setSelectedTeamIds([]);
      }
    });
  };

  if (projsLoading || catsLoading || peopleLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center p-8 gap-3 text-muted-text">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-xs">در حال دریافت فیلدهای بارگذاری...</span>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === "active");
  const activePeople = people.filter(p => p.is_active);

  return (
    <div className="bg-slate-50 border border-slate-100/60 p-5 rounded-3xl space-y-4">
      <h3 className="text-sm font-black text-ink flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-700" />
        <span>ثبت تعهدات و تخصیص ظرفیت</span>
      </h3>
      <p className="text-xxs text-muted-text leading-relaxed">
        ساعت مقرر (تعهد توافق شده) را بر اساس پروژه، دسته سرویس و مالکان آن ثبت نمایید. دوره انتخابی شما <b className="text-ink">{selectedPeriod}</b> می‌باشد.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
        {/* Project Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-text block">پروژه</label>
          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white"
          >
            <option value="">-- انتخاب پروژه --</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.plane_identifier})
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-text block">دسته کاری و خدماتی</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white"
          >
            <option value="">-- انتخاب دسته کاری --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Hours & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-text block">ساعات توافق شده</label>
            <input
              type="number"
              required
              min={1}
              placeholder="مثال: ۸۰ ساعت"
              value={agreedHours}
              onChange={(e) => setAgreedHours(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-text block">توضیحات و اسناد</label>
            <input
              type="text"
              placeholder="یادداشت کوتاه..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Team Owners Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">انتخاب تیم مالک (تعهد تیمی)</label>
          <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-2xl bg-white p-3 space-y-1.5">
            {teams.length === 0 ? (
              <span className="text-[10px] text-slate-400 block">هیچ تیمی ساخته نشده</span>
            ) : (
              teams.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-xxs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(t.id)}
                    onChange={(e) => handleTeamCheckbox(t.id, e.target.checked)}
                    className="rounded text-ink border-slate-300"
                  />
                  <span>تیم {t.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Person Owners Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">انتخاب اعضای مسئول (مالکان تعهد)</label>
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl bg-white p-3 space-y-1.5">
            {activePeople.length === 0 ? (
              <span className="text-[10px] text-slate-400 block">کاربر کشف‌شده وجود ندارد</span>
            ) : (
              activePeople.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-xxs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPersonIds.includes(p.id)}
                    onChange={(e) => handlePersonCheckbox(p.id, e.target.checked)}
                    className="rounded text-ink border-slate-300"
                  />
                  <span>{p.full_name} ({p.role_title || "بدون سمت"})</span>
                </label>
              ))
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submutting || !projectId || !categoryId || agreedHours === ""}
          className="w-full py-2.5 rounded-full bg-ink text-accent hover:bg-ink/95 font-black text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          <span>ثبت قطعی ظرفیت</span>
        </button>
      </form>
    </div>
  );
}
