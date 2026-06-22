import { StateGroup } from "../../types/domain";
import { DEFAULT_STATE_GROUPS_MAP } from "../../config/stateGroups";

export interface CanonicalTask {
  plane_identifier: string;
  project_name: string;
  project_identifier: string;
  sequence_id: number;
  parent_identifier: string | null;
  name: string;
  state_name: string;
  state_group: StateGroup;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  assignees: { full_name: string; normalized_name: string }[];
  subscribers: { full_name: string; normalized_name: string }[];
  created_by_name: string;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  plane_created_at: string;
  plane_updated_at: string;
  archived_at: string | null;
  estimate: number | null;
  is_draft: boolean;
  labels: { name: string; color?: string }[];
  modules: string[];
  cycles: string[];
  comments: { author_name: string; body: string; plane_created_at: string }[];
  raw: Record<string, any>;
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Safely parse JSON array field, e.g. Assignees "[...]" or Labels
 */
function safeParseJsonArray(str: string): any[] {
  if (!str) return [];
  const clean = str.trim();
  if (!clean || clean === "[]" || clean === "null") return [];
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // Falls back to splitting comma if it's not JSON formatted
    return clean.split(",").map(item => item.trim()).filter(Boolean).map(val => ({ name: val }));
  }
}

/**
 * Safe date format converter
 */
function safeDate(str?: string | null): string | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Maps CSV row fields to a standardized, normalized CanonicalTask list
 */
export function normalizeCsvRows(
  rows: Record<string, string>[],
  stateMappings: Record<string, StateGroup> = DEFAULT_STATE_GROUPS_MAP
): CanonicalTask[] {
  return rows.map((row) => {
    const rawAssignees = safeParseJsonArray(row["Assignees"]);
    const assignees = rawAssignees.map(a => {
      const pName = typeof a === "string" ? a : (a.name || a.full_name || a.display_name || "");
      return {
        full_name: pName.trim(),
        normalized_name: normalizeName(pName)
      };
    }).filter(a => a.full_name.length > 0);

    const rawSubscribers = safeParseJsonArray(row["Subscribers"]);
    const subscribers = rawSubscribers.map(s => {
      const sName = typeof s === "string" ? s : (s.name || s.full_name || s.display_name || "");
      return {
        full_name: sName.trim(),
        normalized_name: normalizeName(sName)
      };
    }).filter(s => s.full_name.length > 0);

    const rawLabels = safeParseJsonArray(row["Labels"]);
    const labels = rawLabels.map(l => {
      const lName = typeof l === "string" ? l : (l.name || "");
      return {
        name: lName.trim(),
        color: l.color || undefined
      };
    }).filter(l => l.name.length > 0);

    const rawModules = safeParseJsonArray(row["Modules"]);
    const modules = rawModules.map(m => typeof m === "string" ? m : (m.name || "")).filter(Boolean);

    const rawCycles = safeParseJsonArray(row["Cycles"]);
    const cycles = rawCycles.map(c => typeof c === "string" ? c : (c.name || "")).filter(Boolean);

    const rawComments = safeParseJsonArray(row["Comments"]);
    const comments = rawComments.map(c => {
      return {
        author_name: (c.author || c.created_by_name || c.actor || "ناشناس").trim(),
        body: (c.comment || c.text || c.body || "").trim(),
        plane_created_at: safeDate(c.created_at) || new Date().toISOString()
      };
    }).filter(c => c.body.length > 0);

    // Dynamic state group matcher (Fallback on Todo's state if missing)
    const stateNameValue = row["State Name"] || "";
    let matchedGroup: StateGroup = "unstarted";
    
    // Check if we have exact match in mappings
    if (stateMappings[stateNameValue]) {
      matchedGroup = stateMappings[stateNameValue];
    } else {
      // Direct substring search fallback for robustness
      const matchedKey = Object.keys(stateMappings).find(k => 
        stateNameValue.toLowerCase().includes(k.toLowerCase())
      );
      if (matchedKey) {
        matchedGroup = stateMappings[matchedKey];
      }
    }

    // Parse estimate
    const rawEstimate = row["Estimate"];
    const estimate = rawEstimate ? parseFloat(rawEstimate) : null;

    // Normalizing priority values
    const prWord = (row["Priority"] || "none").toLowerCase().trim();
    let priority: CanonicalTask["priority"] = "none";
    if (["low", "medium", "high", "urgent"].includes(prWord)) {
      priority = prWord as CanonicalTask["priority"];
    }

    const planeIdentifier = row["Identifier"] || "";

    return {
      plane_identifier: planeIdentifier,
      project_name: row["Project Name"] || "پروژه عمومی",
      project_identifier: row["Project Identifier"] || "GENERAL",
      sequence_id: row["Sequence Id"] ? parseInt(row["Sequence Id"], 10) : 0,
      parent_identifier: row["Parent"] || null,
      name: row["Name"] || "کار بدون عنوان",
      state_name: stateNameValue,
      state_group: matchedGroup,
      priority,
      assignees,
      subscribers,
      created_by_name: row["Created By Name"] || "سیستم",
      start_date: safeDate(row["Start Date"]),
      target_date: safeDate(row["Target Date"]),
      completed_at: safeDate(row["Completed At"]),
      plane_created_at: safeDate(row["Created At"]) || new Date().toISOString(),
      plane_updated_at: safeDate(row["Updated At"]) || new Date().toISOString(),
      archived_at: safeDate(row["Archived At"]),
      estimate: isNaN(estimate as any) ? null : estimate,
      is_draft: row["Is Draft"] === "true",
      labels,
      modules,
      cycles,
      comments,
      raw: row
    };
  });
}
