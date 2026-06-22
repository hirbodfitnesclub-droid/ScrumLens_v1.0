export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface Person {
  id: string;
  user_id: string;
  full_name: string;
  normalized_name: string;
  aliases: string[];
  avatar_color?: string;
  role_title?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Team {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  description?: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  person_id: string;
}

export interface Project {
  id: string;
  user_id: string;
  plane_identifier: string;
  name: string;
  color?: string;
  status: "active" | "archived";
  created_at?: string;
}

export interface Label {
  id: string;
  user_id: string;
  name: string;
  color?: string;
}

export interface Module {
  id: string;
  user_id: string;
  name: string;
  project_id: string;
}

export interface Cycle {
  id: string;
  user_id: string;
  name: string;
  project_id: string;
  start_date?: string;
  end_date?: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  plane_identifier: string; // UNIQUE
  sequence_id?: number;
  parent_identifier?: string;
  name: string;
  state_name: string;
  state_group: StateGroup;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  created_by_name?: string;
  start_date?: string;
  target_date?: string;
  completed_at?: string;
  plane_created_at: string;
  plane_updated_at: string;
  archived_at?: string;
  estimate?: number;
  is_draft: boolean;
  
  // Sync Status and auditing
  sync_status: "active" | "deleted";
  content_hash: string;
  first_seen_import?: string;
  last_seen_import?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  raw?: Record<string, any>;
  
  // Loaded relational fields from Join (for UI usage)
  project?: Project;
  assignees?: Person[];
  subscribers?: Person[];
  labels?: Label[];
  modules?: Module[];
  cycles?: Cycle[];
}

export interface Comment {
  id: string;
  user_id: string;
  task_id: string;
  author_name: string;
  person_id?: string;
  body: string;
  plane_created_at: string;
  content_hash: string;
}

export interface ImportRun {
  id: string;
  user_id: string;
  file_name: string;
  imported_at: string;
  row_count: number;
  summary: {
    added: number;
    updated: number;
    removed: number;
    restored: number;
    unchanged: number;
  };
}

export interface TaskChange {
  id: string;
  user_id: string;
  import_id: string;
  task_id: string;
  plane_identifier: string;
  change_type: "added" | "updated" | "removed" | "restored";
  field_diffs: Record<string, { from: any; to: any }>;
}

export interface StateGroupMap {
  id: string;
  user_id: string;
  state_name: string;
  state_group: StateGroup;
}

export interface WorkCategory {
  id: string;
  user_id: string;
  name: string;
}

export interface Allocation {
  id: string;
  user_id: string;
  project_id: string;
  category_id: string;
  agreed_hours: number;
  period_month: string; // 'YYYY-MM' (Persian Solar index or standard)
  notes?: string;
  created_at?: string;
  
  // Joined fields
  project?: Project;
  category?: WorkCategory;
  owners?: AllocationOwner[];
}

export interface AllocationOwner {
  id: string;
  user_id: string;
  allocation_id: string;
  person_id?: string;
  team_id?: string;
  
  person?: Person;
  team?: Team;
}

export interface ReportTemplate {
  id: string;
  user_id: string;
  name: string;
  type: "weekly" | "monthly" | "custom";
  config: {
    sections: string[];
    filters: Record<string, any>;
    audience: "finance" | "po" | "internal";
  };
  created_at?: string;
}
