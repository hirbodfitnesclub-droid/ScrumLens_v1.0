import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { StateGroupMap, WorkCategory } from "../types/domain";
import { DEFAULT_STATE_GROUPS_MAP } from "../config/stateGroups";
import { DEFAULT_WORK_CATEGORIES } from "../config/workCategories";

const STORAGE_KEY_MAPS = "scrumlens_offline_state_maps";
const STORAGE_KEY_CATS = "scrumlens_offline_work_categories";

function getLocalMaps(): StateGroupMap[] {
  const stored = localStorage.getItem(STORAGE_KEY_MAPS);
  if (!stored) {
    const list = Object.entries(DEFAULT_STATE_GROUPS_MAP).map(([name, group]) => ({
      id: crypto.randomUUID(),
      user_id: "offline-user",
      state_name: name,
      state_group: group
    }));
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(list));
    return list;
  }
  return JSON.parse(stored);
}

function getLocalCategories(): WorkCategory[] {
  const stored = localStorage.getItem(STORAGE_KEY_CATS);
  if (!stored) {
    const list = DEFAULT_WORK_CATEGORIES.map(name => ({
      id: crypto.randomUUID(),
      user_id: "offline-user",
      name
    }));
    localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(list));
    return list;
  }
  return JSON.parse(stored);
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchStateGroupMaps(): Promise<StateGroupMap[]> {
  if (!isSupabaseConfigured) {
    return getLocalMaps();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Query database group maps
  const { data, error } = await supabase
    .from("state_group_map")
    .select("*")
    .order("state_name", { ascending: true });

  if (error) throw error;

  // Let's seed defaults on user's first boot if empty
  if (data && data.length === 0) {
    const defaultPayload = Object.entries(DEFAULT_STATE_GROUPS_MAP).map(([name, group]) => ({
      user_id: user.id,
      state_name: name,
      state_group: group,
    }));

    const { data: seeded, error: seedErr } = await supabase
      .from("state_group_map")
      .insert(defaultPayload)
      .select();

    if (seedErr) throw seedErr;
    return seeded as StateGroupMap[];
  }

  return data as StateGroupMap[];
}

export async function upsertStateGroupMap(stateName: string, stateGroup: any): Promise<StateGroupMap> {
  if (!isSupabaseConfigured) {
    const list = getLocalMaps();
    let item = list.find(m => m.state_name === stateName);
    if (!item) {
      item = {
        id: crypto.randomUUID(),
        user_id: "offline-user",
        state_name: stateName,
        state_group: stateGroup
      };
      list.push(item);
    } else {
      item.state_group = stateGroup;
    }
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(list));
    return item;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("وارد شوید");

  const { data, error } = await supabase
    .from("state_group_map")
    .upsert({
      state_name: stateName,
      state_group: stateGroup,
      user_id: user.id,
    }, { onConflict: "user_id,state_name" })
    .select()
    .single();

  if (error) throw error;
  return data as StateGroupMap;
}

export async function fetchWorkCategories(): Promise<WorkCategory[]> {
  if (!isSupabaseConfigured) {
    return getLocalCategories();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("work_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  // Seed default categories for new user
  if (data && data.length === 0) {
    const defaults = DEFAULT_WORK_CATEGORIES.map(name => ({
      name,
      user_id: user.id
    }));

    const { data: seeded, error: seedErr } = await supabase
      .from("work_categories")
      .insert(defaults)
      .select();

    if (seedErr) throw seedErr;
    return seeded as WorkCategory[];
  }

  return data as WorkCategory[];
}

export async function createWorkCategory(name: string): Promise<WorkCategory> {
  if (!isSupabaseConfigured) {
    const list = getLocalCategories();
    const newCat = {
      id: crypto.randomUUID(),
      user_id: "offline-user",
      name
    };
    list.push(newCat);
    localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(list));
    return newCat;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("وارد سیستم شوید");

  const { data, error } = await supabase
    .from("work_categories")
    .insert({ name, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as WorkCategory;
}

export async function deleteWorkCategory(categoryId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const list = getLocalCategories().filter(c => c.id !== categoryId);
    localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(list));
    return;
  }
  const { error } = await supabase
    .from("work_categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw error;
}

// ------------------- REACT QUERY HOOKS -------------------

export function useStateGroupMaps() {
  return useQuery<StateGroupMap[]>({
    queryKey: ["state_group_maps"],
    queryFn: fetchStateGroupMaps,
  });
}

export function useUpsertStateGroupMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stateName, stateGroup }: { stateName: string; stateGroup: any }) =>
      upsertStateGroupMap(stateName, stateGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["state_group_maps"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useWorkCategories() {
  return useQuery<WorkCategory[]>({
    queryKey: ["work_categories"],
    queryFn: fetchWorkCategories,
  });
}

export function useCreateWorkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createWorkCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_categories"] });
    },
  });
}

export function useDeleteWorkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteWorkCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_categories"] });
    },
  });
}
