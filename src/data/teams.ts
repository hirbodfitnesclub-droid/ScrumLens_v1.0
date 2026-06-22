import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Team, TeamMember, Person } from "../types/domain";

const STORAGE_KEY_TEAMS = "scrumlens_offline_teams";
const STORAGE_KEY_MEMBERS = "scrumlens_offline_team_members";

function getLocalTeams(): Team[] {
  const stored = localStorage.getItem(STORAGE_KEY_TEAMS);
  return stored ? JSON.parse(stored) : [];
}
function saveLocalTeams(teams: Team[]) {
  localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
}

function getLocalMembers(): TeamMember[] {
  const stored = localStorage.getItem(STORAGE_KEY_MEMBERS);
  return stored ? JSON.parse(stored) : [];
}
function saveLocalMembers(members: TeamMember[]) {
  localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
}

// ------------------- CRUD FUNCTIONS -------------------

export async function fetchTeams(): Promise<Team[]> {
  if (!isSupabaseConfigured) {
    return getLocalTeams();
  }
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Team[];
}

export async function fetchTeamDetail(teamId: string): Promise<{ team: Team; members: Person[] }> {
  if (!isSupabaseConfigured) {
    const team = getLocalTeams().find(t => t.id === teamId);
    if (!team) throw new Error("تیم یافت نشد");
    const membersIds = getLocalMembers().filter(m => m.team_id === teamId).map(m => m.person_id);
    const storedPeople = localStorage.getItem("scrumlens_offline_people");
    const allPeople: Person[] = storedPeople ? JSON.parse(storedPeople) : [];
    const members = allPeople.filter(p => membersIds.includes(p.id));
    return { team, members };
  }

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamErr) throw teamErr;

  // Fetch memberships
  const { data: memberships, error: memErr } = await supabase
    .from("team_members")
    .select("person_id, people(*)")
    .eq("team_id", teamId);

  if (memErr) throw memErr;

  const members = memberships ? memberships.map((m: any) => m.people).filter(Boolean) : [];
  return { team, members };
}

export async function createTeam(team: Omit<Team, "id" | "user_id">): Promise<Team> {
  if (!isSupabaseConfigured) {
    const local = getLocalTeams();
    const newTeam: Team = {
      ...team,
      user_id: "offline-user",
      id: crypto.randomUUID(),
    };
    local.push(newTeam);
    saveLocalTeams(local);
    return newTeam;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("کاربر کاربری متصل ندارد");

  const { data, error } = await supabase
    .from("teams")
    .insert({ ...team, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Team;
}

export async function deleteTeam(teamId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const local = getLocalTeams().filter(t => t.id !== teamId);
    saveLocalTeams(local);
    const localMembers = getLocalMembers().filter(m => m.team_id !== teamId);
    saveLocalMembers(localMembers);
    return;
  }
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) throw error;
}

export async function addTeamMember(teamId: string, personId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const local = getLocalMembers();
    const exists = local.some(m => m.team_id === teamId && m.person_id === personId);
    if (!exists) {
      local.push({
        id: crypto.randomUUID(),
        user_id: "offline-user",
        team_id: teamId,
        person_id: personId,
      });
      saveLocalMembers(local);
    }
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("احراز هویت الزامی است");

  const { error } = await supabase
    .from("team_members")
    .upsert({ team_id: teamId, person_id: personId, user_id: user.id }, { onConflict: "team_id,person_id" });

  if (error) throw error;
}

export async function removeTeamMember(teamId: string, personId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const local = getLocalMembers().filter(m => !(m.team_id === teamId && m.person_id === personId));
    saveLocalMembers(local);
    return;
  }
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("person_id", personId);

  if (error) throw error;
}

// ------------------- REACT QUERY HOOKS -------------------

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}

export function useTeamDetail(teamId: string) {
  return useQuery<{ team: Team; members: Person[] }>({
    queryKey: ["team_detail", teamId],
    queryFn: () => fetchTeamDetail(teamId),
    enabled: Boolean(teamId),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (team: Omit<Team, "id" | "user_id">) => createTeam(team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, personId }: { teamId: string; personId: string }) => addTeamMember(teamId, personId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team_detail", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, personId }: { teamId: string; personId: string }) => removeTeamMember(teamId, personId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team_detail", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

// ------------------- PERSON TEAMS LOOKUP -------------------

export async function fetchPersonTeams(personId: string): Promise<Team[]> {
  if (!isSupabaseConfigured) {
    const memberships = getLocalMembers().filter((m) => m.person_id === personId);
    const teams = getLocalTeams();
    return teams.filter((t) => memberships.some((m) => m.team_id === t.id));
  }
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, teams(*)")
    .eq("person_id", personId);

  if (error) throw error;
  return (data || []).map((m: any) => m.teams).filter(Boolean) as Team[];
}

export function usePersonTeams(personId: string) {
  return useQuery<Team[]>({
    queryKey: ["person_teams", personId],
    queryFn: () => fetchPersonTeams(personId),
    enabled: Boolean(personId),
  });
}

