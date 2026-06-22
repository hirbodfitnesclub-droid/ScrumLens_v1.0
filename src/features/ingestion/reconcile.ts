import { Task } from "../../types/domain";
import { CanonicalTask } from "./normalize";
import { calculateTaskHash } from "./hash";

export interface ReconciledUpdate {
  task: CanonicalTask;
  existingId: string;
  fieldDiffs: Record<string, { from: any; to: any }>;
}

export interface ReconciliationResult {
  added: CanonicalTask[];
  updated: ReconciledUpdate[];
  removed: Task[];
  restored: Task[];
  unchanged: Task[];
}

/**
 * pure function that computes structural diff between incoming list of tasks
 * and the current snapshot inside the warehouse.
 */
export function reconcileTasks(incoming: CanonicalTask[], existing: Task[]): ReconciliationResult {
  const result: ReconciliationResult = {
    added: [],
    updated: [],
    removed: [],
    restored: [],
    unchanged: [],
  };

  const existingMap = new Map<string, Task>();
  existing.forEach((t) => {
    existingMap.set(t.plane_identifier, t);
  });

  const incomingIdentifiers = new Set<string>();

  // Process all incoming target entries
  incoming.forEach((incTask) => {
    incomingIdentifiers.add(incTask.plane_identifier);
    const matched = existingMap.get(incTask.plane_identifier);

    if (!matched) {
      // New task completely
      result.added.push(incTask);
    } else {
      const incHash = calculateTaskHash(incTask);

      // Check if it's soft-deleted but came back
      if (matched.sync_status === "deleted") {
        result.restored.push(matched);
      } else if (matched.content_hash === incHash) {
        // Active and completely identical
        result.unchanged.push(matched);
      } else {
        // Active but modified content
        const fieldDiffs: Record<string, { from: any; to: any }> = {};
        
        // Track visual fields change
        const compareFields: (keyof CanonicalTask & string)[] = [
          "name",
          "state_name",
          "state_group",
          "priority",
          "start_date",
          "target_date",
          "completed_at",
          "estimate",
          "is_draft"
        ];

        compareFields.forEach((field) => {
          const incVal = incTask[field];
          const extVal = (matched as any)[field];
          
          if (incVal !== extVal) {
            fieldDiffs[field] = {
              from: extVal === undefined ? null : extVal,
              to: incVal
            };
          }
        });

        result.updated.push({
          task: incTask,
          existingId: matched.id,
          fieldDiffs,
        });
      }
    }
  });

  // Any active existing task missing in incoming is indexed as "removed"
  existing.forEach((extTask) => {
    if (extTask.sync_status === "active" && !incomingIdentifiers.has(extTask.plane_identifier)) {
      result.removed.push(extTask);
    }
  });

  return result;
}
