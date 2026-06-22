import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Allocation, AllocationOwner } from "../types/domain";

const STORAGE_KEY_ALLOCATIONS = "scrumlens_offline_allocations";
const STORAGE_KEY_ALLOC_OWNERS = "scrumlens_offline_allocation_owners";

function getLocalAllocations(): Allocation[] {
  const stored = localStorage.getItem(STORAGE_KEY_ALLOCATIONS);
  return stored ? JSON.parse(stored) : [];
}
function saveLocalAllocations(allocs: Allocation[]) {
  localStorage.setItem(STORAGE_KEY_ALLOCATIONS, JSON.stringify(allocs));
}

function getLocalAllocationOwners(): AllocationOwner[] {
  const stored = localStorage.getItem(STORAGE_KEY_ALLOC_OWNERS);
  return stored ? JSON.parse(stored) : [];
}
function saveLocalAllocationOwners(owners: AllocationOwner[]) {
  localStorage.setItem(STORAGE_KEY_ALLOC_OWNERS, JSON.stringify(owners));
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchAllocations(periodMonth?: string): Promise<Allocation[]> {
  if (!isSupabaseConfigured) {
    let list = getLocalAllocations();
    if (periodMonth) {
      list = list.filter(a => a.period_month === periodMonth);
    }
    const allOwners = getLocalAllocationOwners();
    
    // Joint projects & categories local resolution if needed
    const storedProjects = localStorage.getItem("scrumlens_offline_projects");
    const projs = storedProjects ? JSON.parse(storedProjects) : [];
    const storedCats = localStorage.getItem("scrumlens_offline_work_categories");
    const cats = storedCats ? JSON.parse(storedCats) : [];

    return list.map(a => ({
      ...a,
      project: projs.find((p: any) => p.id === a.project_id),
      category: cats.find((c: any) => c.id === a.category_id),
      owners: allOwners.filter(o => o.allocation_id === a.id)
    }));
  }

  let query = supabase
    .from("allocations")
    .select(`
      *,
      project:projects(*),
      category:work_categories(*),
      owners:allocation_owners(
        *,
        person:people(*),
        team:teams(*)
      )
    `);

  if (periodMonth) {
    query = query.eq("period_month", periodMonth);
  }

  const { data, error } = await query.order("period_month", { ascending: false });
  if (error) throw error;

  return (data || []).map((alloc: any) => ({
    ...alloc,
    owners: alloc.owners ? alloc.owners.map((owner: any) => ({
      ...owner,
      person: owner.person,
      team: owner.team
    })) : []
  })) as Allocation[];
}

export async function upsertAllocation(payload: {
  project_id: string;
  category_id: string;
  agreed_hours: number;
  period_month: string;
  notes?: string;
  owner_person_ids?: string[];
  owner_team_ids?: string[];
}): Promise<void> {
  if (!isSupabaseConfigured) {
    const allocs = getLocalAllocations();
    const ownersList = getLocalAllocationOwners();

    let existing = allocs.find(a => 
      a.project_id === payload.project_id && 
      a.category_id === payload.category_id && 
      a.period_month === payload.period_month
    );

    if (!existing) {
      existing = {
        id: crypto.randomUUID(),
        user_id: "offline-user",
        project_id: payload.project_id,
        category_id: payload.category_id,
        agreed_hours: payload.agreed_hours,
        period_month: payload.period_month,
        notes: payload.notes,
      };
      allocs.push(existing);
    } else {
      existing.agreed_hours = payload.agreed_hours;
      existing.notes = payload.notes;
    }

    // Rewrite owners for this allocation
    const cleanOwners = ownersList.filter(o => o.allocation_id !== existing!.id);
    
    if (payload.owner_person_ids) {
      payload.owner_person_ids.forEach(pId => {
        cleanOwners.push({
          id: crypto.randomUUID(),
          user_id: "offline-user",
          allocation_id: existing!.id,
          person_id: pId,
        });
      });
    }

    if (payload.owner_team_ids) {
      payload.owner_team_ids.forEach(tId => {
        cleanOwners.push({
          id: crypto.randomUUID(),
          user_id: "offline-user",
          allocation_id: existing!.id,
          team_id: tId,
        });
      });
    }

    saveLocalAllocations(allocs);
    saveLocalAllocationOwners(cleanOwners);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("وارد شوید");

  // 1. Upsert core allocation
  const { data: allocation, error: allocErr } = await supabase
    .from("allocations")
    .upsert({
      project_id: payload.project_id,
      category_id: payload.category_id,
      agreed_hours: payload.agreed_hours,
      period_month: payload.period_month,
      notes: payload.notes,
      user_id: user.id
    }, { onConflict: "user_id,project_id,category_id,period_month" })
    .select()
    .single();

  if (allocErr) throw allocErr;

  // 2. Clear old owners for this allocation
  const { error: clearOwnersErr } = await supabase
    .from("allocation_owners")
    .delete()
    .eq("allocation_id", allocation.id);

  if (clearOwnersErr) throw clearOwnersErr;

  // 3. Write new owners
  const newOwners: any[] = [];
  
  if (payload.owner_person_ids && payload.owner_person_ids.length > 0) {
    payload.owner_person_ids.forEach(personId => {
      newOwners.push({
        allocation_id: allocation.id,
        person_id: personId,
        user_id: user.id
      });
    });
  }

  if (payload.owner_team_ids && payload.owner_team_ids.length > 0) {
    payload.owner_team_ids.forEach(teamId => {
      newOwners.push({
        allocation_id: allocation.id,
        team_id: teamId,
        user_id: user.id
      });
    });
  }

  if (newOwners.length > 0) {
    const { error: ownersInsertErr } = await supabase
      .from("allocation_owners")
      .insert(newOwners);

    if (ownersInsertErr) throw ownersInsertErr;
  }
}

export async function deleteAllocation(allocationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const allocs = getLocalAllocations().filter(a => a.id !== allocationId);
    saveLocalAllocations(allocs);
    const owners = getLocalAllocationOwners().filter(o => o.allocation_id !== allocationId);
    saveLocalAllocationOwners(owners);
    return;
  }
  const { error } = await supabase
    .from("allocations")
    .delete()
    .eq("id", allocationId);

  if (error) throw error;
}

// ------------------- REACT QUERY HOOKS -------------------

export function useAllocations(periodMonth?: string) {
  return useQuery<Allocation[]>({
    queryKey: ["allocations", periodMonth],
    queryFn: () => fetchAllocations(periodMonth),
  });
}

export function useUpsertAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      project_id: string;
      category_id: string;
      agreed_hours: number;
      period_month: string;
      notes?: string;
      owner_person_ids?: string[];
      owner_team_ids?: string[];
    }) => upsertAllocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allocationId: string) => deleteAllocation(allocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
}
