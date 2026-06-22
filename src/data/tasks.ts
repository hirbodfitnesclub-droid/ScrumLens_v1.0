import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Task } from "../types/domain";

const STORAGE_KEY_TASKS = "scrumlens_offline_tasks";
export function getLocalTasks(): Task[] {
  const stored = localStorage.getItem(STORAGE_KEY_TASKS);
  return stored ? JSON.parse(stored) : [];
}
export function saveLocalTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchTasks(filters?: {
  projectId?: string;
  assigneeId?: string;
  stateGroup?: string;
}): Promise<Task[]> {
  if (!isSupabaseConfigured) {
    let list = getLocalTasks();
    if (filters?.projectId) {
      list = list.filter(t => t.project_id === filters.projectId);
    }
    if (filters?.stateGroup) {
      list = list.filter(t => t.state_group === filters.stateGroup);
    }
    // Deep load mock projects/assignees if necessary
    return list;
  }

  let query = supabase
    .from("tasks")
    .select(`
      *,
      project:projects(*),
      task_assignees(person_id, people(*)),
      task_subscribers(person_id, people(*)),
      task_labels(label_id, labels(*)),
      task_modules(module_id, modules(*)),
      task_cycles(cycle_id, cycles(*))
    `)
    .eq("sync_status", "active")
    .order("plane_updated_at", { ascending: false });

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters?.stateGroup) {
    query = query.eq("state_group", filters.stateGroup);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Flatten the many-to-many join fields for easier frontend parsing
  const formattedTasks = (data || []).map((t: any) => {
    return {
      ...t,
      project: t.project,
      assignees: t.task_assignees ? t.task_assignees.map((ta: any) => ta.people).filter(Boolean) : [],
      subscribers: t.task_subscribers ? t.task_subscribers.map((ts: any) => ts.people).filter(Boolean) : [],
      labels: t.task_labels ? t.task_labels.map((tl: any) => tl.labels).filter(Boolean) : [],
      modules: t.task_modules ? t.task_modules.map((tm: any) => tm.modules).filter(Boolean) : [],
      cycles: t.task_cycles ? t.task_cycles.map((tc: any) => tc.cycles).filter(Boolean) : [],
    };
  });

  return formattedTasks as Task[];
}

export async function fetchTaskCount(): Promise<number> {
  if (!isSupabaseConfigured) {
    return getLocalTasks().length;
  }
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("sync_status", "active");

  if (error) throw error;
  return count || 0;
}

// ------------------- REACT QUERY HOOKS -------------------

export function useTasks(filters?: { projectId?: string; assigneeId?: string; stateGroup?: string }) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
  });
}

export function useTaskCount() {
  return useQuery<number>({
    queryKey: ["tasks_count"],
    queryFn: fetchTaskCount,
  });
}
