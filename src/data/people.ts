import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Person } from "../types/domain";

// Helper of local caching / fallback when Supabase is unconfigured
const STORAGE_KEY_PEOPLE = "scrumlens_offline_people";
function getLocalPeople(): Person[] {
  const stored = localStorage.getItem(STORAGE_KEY_PEOPLE);
  return stored ? JSON.parse(stored) : [];
}
function saveLocalPeople(people: Person[]) {
  localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchPeople(): Promise<Person[]> {
  if (!isSupabaseConfigured) {
    return getLocalPeople();
  }
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data as Person[];
}

export async function upsertPerson(person: Omit<Person, "user_id" | "id"> & { id?: string }): Promise<Person> {
  if (!isSupabaseConfigured) {
    const local = getLocalPeople();
    const existingIndex = local.findIndex((p) => p.id === person.id || p.normalized_name === person.normalized_name);
    
    const newPerson: Person = {
      ...person,
      user_id: "offline-user",
      is_active: person.is_active ?? true,
      aliases: person.aliases ?? [],
      id: person.id || crypto.randomUUID(),
    };

    if (existingIndex > -1) {
      local[existingIndex] = { ...local[existingIndex], ...newPerson };
    } else {
      local.push(newPerson);
    }
    saveLocalPeople(local);
    return newPerson;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("کاربر احراز هویت نشده است");

  const payload = {
    ...person,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("people")
    .upsert(payload, { onConflict: "user_id,normalized_name" })
    .select()
    .single();

  if (error) throw error;
  return data as Person;
}

/**
 * Merges duplicate_person_id into primary_person_id
 * Translates aliases and references.
 */
export async function mergePeople(primaryId: string, duplicateId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const local = getLocalPeople();
    const primary = local.find(p => p.id === primaryId);
    const duplicate = local.find(p => p.id === duplicateId);
    if (!primary || !duplicate) return;

    primary.aliases = Array.from(new Set([...primary.aliases, duplicate.full_name, ...duplicate.aliases]));
    const indexDupl = local.findIndex(p => p.id === duplicateId);
    if (indexDupl > -1) local.splice(indexDupl, 1);
    saveLocalPeople(local);
    return;
  }

  // 1. Fetch source person to get aliases
  const { data: duplicatePerson, error: fetchErr } = await supabase
    .from("people")
    .select("*")
    .eq("id", duplicateId)
    .single();

  if (fetchErr) throw fetchErr;

  const { data: primaryPerson, error: fetchPrimErr } = await supabase
    .from("people")
    .select("*")
    .eq("id", primaryId)
    .single();

  if (fetchPrimErr) throw fetchPrimErr;

  // 2. Prepare new aliases array
  const updatedAliases = Array.from(
    new Set([
      ...(primaryPerson.aliases || []),
      duplicatePerson.full_name,
      ...(duplicatePerson.aliases || [])
    ])
  );

  // 3. Update the primary person
  const { error: updatePrimErr } = await supabase
    .from("people")
    .update({ aliases: updatedAliases })
    .eq("id", primaryId);

  if (updatePrimErr) throw updatePrimErr;

  // 4. Update references in allocation owners, task assignees, etc in transaction or sequentially
  await supabase
    .from("task_assignees")
    .update({ person_id: primaryId })
    .eq("person_id", duplicateId);

  await supabase
    .from("task_subscribers")
    .update({ person_id: primaryId })
    .eq("person_id", duplicateId);

  await supabase
    .from("comments")
    .update({ person_id: primaryId })
    .eq("person_id", duplicateId);

  await supabase
    .from("allocation_owners")
    .update({ person_id: primaryId })
    .eq("person_id", duplicateId);

  // 5. Delete duplicate person
  const { error: deleteErr } = await supabase
    .from("people")
    .delete()
    .eq("id", duplicateId);

  if (deleteErr) throw deleteErr;
}

// ------------------- REACT QUERY HOOKS -------------------

export function usePeople() {
  return useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: fetchPeople,
  });
}

export function useUpsertPerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (person: Omit<Person, "user_id" | "id"> & { id?: string }) => upsertPerson(person),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useMergePeople() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) =>
      mergePeople(primaryId, duplicateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
}
