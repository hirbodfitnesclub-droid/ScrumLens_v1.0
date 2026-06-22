import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface UnsyncedSummary {
  peopleCount: number;
  teamsCount: number;
  membersCount: number;
  projectsCount: number;
  categoriesCount: number;
  mapsCount: number;
  allocationsCount: number;
  ownersCount: number;
  tasksCount: number;
  commentsCount: number;
  importsCount: number;
  changesCount: number;
  totalUnsynced: number;
}

// Helper functions to read local storage
function getLocal(key: string): any[] {
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Checks what local storage records do not exist in the Supabase database.
 */
export async function getUnsyncedSummary(): Promise<UnsyncedSummary> {
  const defaultSummary: UnsyncedSummary = {
    peopleCount: 0,
    teamsCount: 0,
    membersCount: 0,
    projectsCount: 0,
    categoriesCount: 0,
    mapsCount: 0,
    allocationsCount: 0,
    ownersCount: 0,
    tasksCount: 0,
    commentsCount: 0,
    importsCount: 0,
    changesCount: 0,
    totalUnsynced: 0,
  };

  if (!isSupabaseConfigured) {
    return defaultSummary;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultSummary;

    // Fetch IDs of existing records from Supabase in parallel
    const [
      { data: dbPeople },
      { data: dbTeams },
      { data: dbMembers },
      { data: dbProjects },
      { data: dbCategories },
      { data: dbMaps },
      { data: dbAllocations },
      { data: dbOwners },
      { data: dbTasks },
      { data: dbComments },
      { data: dbImports },
      { data: dbChanges },
    ] = await Promise.all([
      supabase.from("people").select("id").eq("user_id", user.id),
      supabase.from("teams").select("id").eq("user_id", user.id),
      supabase.from("team_members").select("id").eq("user_id", user.id),
      supabase.from("projects").select("id").eq("user_id", user.id),
      supabase.from("work_categories").select("id").eq("user_id", user.id),
      supabase.from("state_group_map").select("id").eq("user_id", user.id),
      supabase.from("allocations").select("id").eq("user_id", user.id),
      supabase.from("allocation_owners").select("id").eq("user_id", user.id),
      supabase.from("tasks").select("id").eq("user_id", user.id),
      supabase.from("comments").select("id").eq("user_id", user.id),
      supabase.from("imports").select("id").eq("user_id", user.id),
      supabase.from("task_changes").select("id").eq("user_id", user.id),
    ]);

    const createIdSet = (data: any[] | null) => new Set((data || []).map((row) => row.id));

    const peopleSet = createIdSet(dbPeople);
    const teamsSet = createIdSet(dbTeams);
    const membersSet = createIdSet(dbMembers);
    const projectsSet = createIdSet(dbProjects);
    const categoriesSet = createIdSet(dbCategories);
    const mapsSet = createIdSet(dbMaps);
    const allocationsSet = createIdSet(dbAllocations);
    const ownersSet = createIdSet(dbOwners);
    const tasksSet = createIdSet(dbTasks);
    const commentsSet = createIdSet(dbComments);
    const importsSet = createIdSet(dbImports);
    const changesSet = createIdSet(dbChanges);

    // Read local records
    const localPeople = getLocal("scrumlens_offline_people");
    const localTeams = getLocal("scrumlens_offline_teams");
    const localMembers = getLocal("scrumlens_offline_team_members");
    const localProjects = getLocal("scrumlens_offline_projects");
    const localCategories = getLocal("scrumlens_offline_work_categories");
    const localMaps = getLocal("scrumlens_offline_state_maps");
    const localAllocations = getLocal("scrumlens_offline_allocations");
    const localOwners = getLocal("scrumlens_offline_allocation_owners");
    const localTasks = getLocal("scrumlens_offline_tasks");
    const localComments = getLocal("scrumlens_offline_comments");
    const localImports = getLocal("scrumlens_offline_imports");
    const localChanges = getLocal("scrumlens_offline_changes");

    // Filter unsynced records
    const unsyncedPeople = localPeople.filter((p) => !peopleSet.has(p.id));
    const unsyncedTeams = localTeams.filter((t) => !teamsSet.has(t.id));
    const unsyncedMembers = localMembers.filter((m) => !membersSet.has(m.id));
    const unsyncedProjects = localProjects.filter((p) => !projectsSet.has(p.id));
    const unsyncedCategories = localCategories.filter((c) => !categoriesSet.has(c.id));
    const unsyncedMaps = localMaps.filter((m) => !mapsSet.has(m.id));
    const unsyncedAllocations = localAllocations.filter((a) => !allocationsSet.has(a.id));
    const unsyncedOwners = localOwners.filter((o) => !ownersSet.has(o.id));
    const unsyncedTasks = localTasks.filter((t) => !tasksSet.has(t.id));
    const unsyncedComments = localComments.filter((c) => !commentsSet.has(c.id));
    const unsyncedImports = localImports.filter((i) => !importsSet.has(i.id));
    const unsyncedChanges = localChanges.filter((c) => !changesSet.has(c.id));

    const totalUnsynced =
      unsyncedPeople.length +
      unsyncedTeams.length +
      unsyncedMembers.length +
      unsyncedProjects.length +
      unsyncedCategories.length +
      unsyncedMaps.length +
      unsyncedAllocations.length +
      unsyncedOwners.length +
      unsyncedTasks.length +
      unsyncedComments.length +
      unsyncedImports.length +
      unsyncedChanges.length;

    return {
      peopleCount: unsyncedPeople.length,
      teamsCount: unsyncedTeams.length,
      membersCount: unsyncedMembers.length,
      projectsCount: unsyncedProjects.length,
      categoriesCount: unsyncedCategories.length,
      mapsCount: unsyncedMaps.length,
      allocationsCount: unsyncedAllocations.length,
      ownersCount: unsyncedOwners.length,
      tasksCount: unsyncedTasks.length,
      commentsCount: unsyncedComments.length,
      importsCount: unsyncedImports.length,
      changesCount: unsyncedChanges.length,
      totalUnsynced,
    };
  } catch (err) {
    console.error("Error calculating unsynced records:", err);
    return defaultSummary;
  }
}

/**
 * Uploads all offline/unsynced records from localStorage into Supabase.
 * Uses a smart ID translation technique: maps key fields of existing Supabase entities to avoid ID mutations
 * on conflicting upserts, preventing foreign key integrity violations.
 */
export async function syncLocalStorageToSupabase(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("پروژه سوپابیس برای این لوکال هاست تنظیم نشده است.");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("نشست کاربری نامعتبر است. دوباره تلاش کنید.");
  }

  // Retrieve all local files
  const localPeople = getLocal("scrumlens_offline_people");
  const localTeams = getLocal("scrumlens_offline_teams");
  const localMembers = getLocal("scrumlens_offline_team_members");
  const localProjects = getLocal("scrumlens_offline_projects");
  const localCategories = getLocal("scrumlens_offline_work_categories");
  const localMaps = getLocal("scrumlens_offline_state_maps");
  const localAllocations = getLocal("scrumlens_offline_allocations");
  const localOwners = getLocal("scrumlens_offline_allocation_owners");
  const localTasks = getLocal("scrumlens_offline_tasks");
  const localComments = getLocal("scrumlens_offline_comments");
  const localImports = getLocal("scrumlens_offline_imports");
  const localChanges = getLocal("scrumlens_offline_changes");

  // Fetch parent entities from database to extract existing UUID mappings
  const [
    { data: dbCategories },
    { data: dbMaps },
    { data: dbPeople },
    { data: dbProjects },
    { data: dbTeams },
    { data: dbTasks },
  ] = await Promise.all([
    supabase.from("work_categories").select("id, name").eq("user_id", user.id),
    supabase.from("state_group_map").select("id, state_name").eq("user_id", user.id),
    supabase.from("people").select("id, normalized_name").eq("user_id", user.id),
    supabase.from("projects").select("id, plane_identifier").eq("user_id", user.id),
    supabase.from("teams").select("id, name").eq("user_id", user.id),
    supabase.from("tasks").select("id, plane_identifier").eq("user_id", user.id),
  ]);

  // Construct translation maps for matching names/identifiers to active DB UUIDs
  const categoryIdMap = new Map<string, string>();
  const originalCategoryIdMap = new Map<string, string>();
  dbCategories?.forEach(c => categoryIdMap.set(c.name, c.id));

  const mapIdMap = new Map<string, string>();
  dbMaps?.forEach(m => mapIdMap.set(m.state_name, m.id));

  const personIdMap = new Map<string, string>();
  const originalPersonIdMap = new Map<string, string>();
  dbPeople?.forEach(p => personIdMap.set(p.normalized_name, p.id));

  const projectIdMap = new Map<string, string>();
  const originalProjectIdMap = new Map<string, string>();
  dbProjects?.forEach(p => projectIdMap.set(p.plane_identifier, p.id));

  const teamIdMap = new Map<string, string>();
  const originalTeamIdMap = new Map<string, string>();
  dbTeams?.forEach(t => teamIdMap.set(t.name, t.id));

  const taskIdMap = new Map<string, string>();
  const originalTaskIdMap = new Map<string, string>();
  dbTasks?.forEach(t => taskIdMap.set(t.plane_identifier, t.id));

  // 1. Process & Translate Independent Tables
  const updatedCategories = localCategories.map(cat => {
    const dbId = categoryIdMap.get(cat.name);
    const targetId = dbId || cat.id;
    originalCategoryIdMap.set(cat.id, targetId);
    return { ...cat, id: targetId, user_id: user.id };
  });

  const updatedMaps = localMaps.map(m => {
    const dbId = mapIdMap.get(m.state_name);
    const targetId = dbId || m.id;
    return { ...m, id: targetId, user_id: user.id };
  });

  const updatedPeople = localPeople.map(p => {
    const dbId = personIdMap.get(p.normalized_name);
    const targetId = dbId || p.id;
    originalPersonIdMap.set(p.id, targetId);
    return { ...p, id: targetId, user_id: user.id };
  });

  const updatedProjects = localProjects.map(proj => {
    const dbId = projectIdMap.get(proj.plane_identifier);
    const targetId = dbId || proj.id;
    originalProjectIdMap.set(proj.id, targetId);
    return { ...proj, id: targetId, user_id: user.id };
  });

  const updatedTeams = localTeams.map(t => {
    const dbId = teamIdMap.get(t.name);
    const targetId = dbId || t.id;
    originalTeamIdMap.set(t.id, targetId);
    return { ...t, id: targetId, user_id: user.id };
  });

  // Upsert parent hierarchies with their correct associated database primary keys
  if (updatedCategories.length > 0) {
    const { error } = await supabase
      .from("work_categories")
      .upsert(updatedCategories, { onConflict: "user_id,name" });
    if (error) throw error;
  }
  if (updatedMaps.length > 0) {
    const { error } = await supabase
      .from("state_group_map")
      .upsert(updatedMaps, { onConflict: "user_id,state_name" });
    if (error) throw error;
  }
  if (updatedPeople.length > 0) {
    const { error } = await supabase
      .from("people")
      .upsert(updatedPeople, { onConflict: "user_id,normalized_name" });
    if (error) throw error;
  }
  if (updatedProjects.length > 0) {
    const { error } = await supabase
      .from("projects")
      .upsert(updatedProjects, { onConflict: "user_id,plane_identifier" });
    if (error) throw error;
  }
  if (updatedTeams.length > 0) {
    const { error } = await supabase
      .from("teams")
      .upsert(updatedTeams, { onConflict: "user_id,name" });
    if (error) throw error;
  }

  // 2. Fetch and Map Team Members to prevent direct primary ID modification on conflict
  const { data: dbMembers } = await supabase.from("team_members").select("id, team_id, person_id").eq("user_id", user.id);
  const memberIdMap = new Map<string, string>();
  dbMembers?.forEach(m => memberIdMap.set(`${m.team_id}:${m.person_id}`, m.id));

  const updatedMembers = localMembers.map(m => {
    const updatedTeamId = originalTeamIdMap.get(m.team_id) || m.team_id;
    const updatedPersonId = originalPersonIdMap.get(m.person_id) || m.person_id;
    const key = `${updatedTeamId}:${updatedPersonId}`;
    const dbId = memberIdMap.get(key);
    const targetId = dbId || m.id;
    return {
      ...m,
      id: targetId,
      team_id: updatedTeamId,
      person_id: updatedPersonId,
      user_id: user.id
    };
  });

  if (updatedMembers.length > 0) {
    const { error } = await supabase
      .from("team_members")
      .upsert(updatedMembers, { onConflict: "team_id,person_id" });
    if (error) throw error;
  }

  // 3. Fetch and Map Allocations to prevent parent PK mismatch
  const { data: dbAllocations } = await supabase.from("allocations").select("id, project_id, category_id, period_month").eq("user_id", user.id);
  const allocationIdMap = new Map<string, string>();
  const originalAllocationIdMap = new Map<string, string>();
  dbAllocations?.forEach(a => allocationIdMap.set(`${a.project_id}:${a.category_id}:${a.period_month}`, a.id));

  const updatedAllocations = localAllocations.map(a => {
    const updatedProjId = originalProjectIdMap.get(a.project_id) || a.project_id;
    const updatedCatId = originalCategoryIdMap.get(a.category_id) || a.category_id;
    const key = `${updatedProjId}:${updatedCatId}:${a.period_month}`;
    const dbId = allocationIdMap.get(key);
    const targetId = dbId || a.id;
    originalAllocationIdMap.set(a.id, targetId);
    return {
      ...a,
      id: targetId,
      project_id: updatedProjId,
      category_id: updatedCatId,
      user_id: user.id
    };
  });

  if (updatedAllocations.length > 0) {
    const { error } = await supabase
      .from("allocations")
      .upsert(updatedAllocations, { onConflict: "user_id,project_id,category_id,period_month" });
    if (error) throw error;
  }

  // 4. Map Allocation Owners
  const updatedOwners = localOwners.map(o => {
    const updatedAllocId = originalAllocationIdMap.get(o.allocation_id) || o.allocation_id;
    const updatedPersonId = o.person_id ? (originalPersonIdMap.get(o.person_id) || o.person_id) : null;
    const updatedTeamId = o.team_id ? (originalTeamIdMap.get(o.team_id) || o.team_id) : null;
    return {
      ...o,
      allocation_id: updatedAllocId,
      person_id: updatedPersonId,
      team_id: updatedTeamId,
      user_id: user.id
    };
  });

  if (updatedOwners.length > 0) {
    const { error } = await supabase
      .from("allocation_owners")
      .upsert(updatedOwners, { onConflict: "id" });
    if (error) throw error;
  }

  // 5. Map & Upsert Tasks
  const updatedTasks = localTasks.map(t => {
    const { project, assignees, subscribers, labels, modules, cycles, ...dbFields } = t;
    const updatedProjId = originalProjectIdMap.get(t.project_id) || t.project_id;
    const dbId = taskIdMap.get(t.plane_identifier);
    const targetId = dbId || t.id;
    originalTaskIdMap.set(t.id, targetId);

    return {
      ...dbFields,
      id: targetId,
      project_id: updatedProjId,
      user_id: user.id
    };
  });

  if (updatedTasks.length > 0) {
    const { error } = await supabase
      .from("tasks")
      .upsert(updatedTasks, { onConflict: "user_id,plane_identifier" });
    if (error) throw error;
  }

  // 6. Map Comments
  const { data: dbComments } = await supabase.from("comments").select("id, task_id, content_hash").eq("user_id", user.id);
  const commentIdMap = new Map<string, string>();
  dbComments?.forEach(c => commentIdMap.set(`${c.task_id}:${c.content_hash}`, c.id));

  const updatedComments = localComments.map(c => {
    const updatedTaskId = originalTaskIdMap.get(c.task_id) || c.task_id;
    const updatedPersonId = c.person_id ? (originalPersonIdMap.get(c.person_id) || c.person_id) : null;
    const key = `${updatedTaskId}:${c.content_hash}`;
    const dbId = commentIdMap.get(key);
    const targetId = dbId || c.id;
    return {
      ...c,
      id: targetId,
      task_id: updatedTaskId,
      person_id: updatedPersonId,
      user_id: user.id
    };
  });

  if (updatedComments.length > 0) {
    const { error } = await supabase
      .from("comments")
      .upsert(updatedComments, { onConflict: "user_id,task_id,content_hash" });
    if (error) throw error;
  }

  // 7. Map Imports
  const updatedImports = localImports.map(i => ({
    ...i,
    user_id: user.id
  }));

  if (updatedImports.length > 0) {
    const { error } = await supabase
      .from("imports")
      .upsert(updatedImports, { onConflict: "id" });
    if (error) throw error;
  }

  // 8. Map Task Changes
  const updatedChanges = localChanges.map(c => {
    const updatedTaskId = originalTaskIdMap.get(c.task_id) || c.task_id;
    return {
      ...c,
      task_id: updatedTaskId,
      user_id: user.id
    };
  });

  if (updatedChanges.length > 0) {
    const { error } = await supabase
      .from("task_changes")
      .upsert(updatedChanges, { onConflict: "id" });
    if (error) throw error;
  }
}

// ----------------- REACT QUERY HOOKS -----------------

export function useSyncStatus() {
  return useQuery<UnsyncedSummary>({
    queryKey: ["unsynced_summary"],
    queryFn: getUnsyncedSummary,
    refetchInterval: 12000, // Automagically check every 12 seconds
  });
}

export function usePerformSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncLocalStorageToSupabase,
    onSuccess: () => {
      // Invalidate everything to show fully updated synced database records
      queryClient.invalidateQueries();
    },
  });
}
