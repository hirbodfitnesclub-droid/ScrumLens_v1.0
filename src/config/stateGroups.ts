import { StateGroup } from "../types/domain";

export const DEFAULT_STATE_GROUPS_MAP: Record<string, StateGroup> = {
  "Backlog": "backlog",
  "Triage": "unstarted",
  "Todo": "unstarted",
  "Unstarted": "unstarted",
  "Todo / Unstarted": "unstarted",
  "In Progress (Dev)": "started",
  "In Progress": "started",
  "Doing": "started",
  "In Progress / Doing": "started",
  "In Review": "started",
  "Done": "completed",
  "Completed": "completed",
  "Done / Completed": "completed",
  "Cancelled": "cancelled",
  "Canceled": "cancelled",
  "Cancelled / Canceled": "cancelled",
};

export const STATE_GROUP_LABELS: Record<StateGroup, string> = {
  backlog: "بک‌لاگ (Backlog)",
  unstarted: "شروع‌نشده (Unstarted)",
  started: "در حال انجام (Started)",
  completed: "تکمیل‌شده (Completed)",
  cancelled: "لغوشده (Cancelled)",
};

export const STATE_GROUP_COLORS: Record<StateGroup, string> = {
  backlog: "bg-slate-100 text-slate-800 border-slate-200",
  unstarted: "bg-amber-50 text-amber-800 border-amber-200",
  started: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200",
};
