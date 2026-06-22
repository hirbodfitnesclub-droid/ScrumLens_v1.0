import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Comment } from "../types/domain";

const STORAGE_KEY_COMMENTS = "scrumlens_offline_comments";

export function getLocalComments(): Comment[] {
  const stored = localStorage.getItem(STORAGE_KEY_COMMENTS);
  return stored ? JSON.parse(stored) : [];
}

export function saveLocalComments(comments: Comment[]) {
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchTaskComments(taskId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured) {
    return getLocalComments().filter(c => c.task_id === taskId);
  }
  const { data, error } = await supabase
    .from("comments")
    .select("*, people(*)")
    .eq("task_id", taskId)
    .order("plane_created_at", { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

// ------------------- REACT QUERY HOOKS -------------------

export function useTaskComments(taskId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", taskId],
    queryFn: () => fetchTaskComments(taskId),
    enabled: Boolean(taskId),
  });
}
