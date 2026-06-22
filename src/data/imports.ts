import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ImportRun, TaskChange } from "../types/domain";

const STORAGE_KEY_IMPORTS = "scrumlens_offline_imports";
const STORAGE_KEY_CHANGES = "scrumlens_offline_changes";

export function getLocalImports(): ImportRun[] {
  const stored = localStorage.getItem(STORAGE_KEY_IMPORTS);
  return stored ? JSON.parse(stored) : [];
}
export function saveLocalImports(imports: ImportRun[]) {
  localStorage.setItem(STORAGE_KEY_IMPORTS, JSON.stringify(imports));
}

export function getLocalChanges(): TaskChange[] {
  const stored = localStorage.getItem(STORAGE_KEY_CHANGES);
  return stored ? JSON.parse(stored) : [];
}
export function saveLocalChanges(changes: TaskChange[]) {
  localStorage.setItem(STORAGE_KEY_CHANGES, JSON.stringify(changes));
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchImports(): Promise<ImportRun[]> {
  if (!isSupabaseConfigured) {
    return getLocalImports();
  }
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .order("imported_at", { ascending: false });

  if (error) throw error;
  return data as ImportRun[];
}

export async function fetchTaskChanges(taskId: string): Promise<TaskChange[]> {
  if (!isSupabaseConfigured) {
    return getLocalChanges().filter(c => c.task_id === taskId);
  }
  const { data, error } = await supabase
    .from("task_changes")
    .select("*")
    .eq("task_id", taskId)
    .order("id", { ascending: false });

  if (error) throw error;
  return data as TaskChange[];
}

// ------------------- REACT QUERY HOOKS -------------------

export function useImports() {
  return useQuery<ImportRun[]>({
    queryKey: ["imports"],
    queryFn: fetchImports,
  });
}

export function useTaskChanges(taskId: string) {
  return useQuery<TaskChange[]>({
    queryKey: ["task_changes", taskId],
    queryFn: () => fetchTaskChanges(taskId),
    enabled: Boolean(taskId),
  });
}
