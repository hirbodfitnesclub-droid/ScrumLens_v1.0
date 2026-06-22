import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Project } from "../types/domain";

const STORAGE_KEY_PROJECTS = "scrumlens_offline_projects";
function getLocalProjects(): Project[] {
  const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
  return stored ? JSON.parse(stored) : [];
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return getLocalProjects();
  }
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Project[];
}

export async function updateProjectStatus(projectId: string, status: "active" | "archived"): Promise<void> {
  if (!isSupabaseConfigured) {
    const local = getLocalProjects();
    const item = local.find(p => p.id === projectId);
    if (item) {
      item.status = status;
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(local));
    }
    return;
  }
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) throw error;
}

// ------------------- REACT QUERY HOOKS -------------------

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: "active" | "archived" }) =>
      updateProjectStatus(projectId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
