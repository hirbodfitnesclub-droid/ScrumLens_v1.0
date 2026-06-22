import dayjs from "../../lib/dayjs";
import { Task } from "../../types/domain";

interface FiltersState {
  projectId: string | null;
  assigneeId: string | null;
  teamId: string | null;
  stateGroup: string | null;
  moduleId: string | null;
  labelId: string | null;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Pure selector function to filter tasks list according to filter configuration
 * @param tasks - List of tasks
 * @param filters - Selected UI filters
 * @param teamMemberIdsList - Optional array of person IDs belonging to the selected team (when teamId is active)
 */
export function filterTasksList(
  tasks: Task[],
  filters: FiltersState,
  teamMemberIdsList?: string[]
): Task[] {
  return tasks.filter((task) => {
    // 0. Only show active sync tasks
    if (task.sync_status !== "active") return false;

    // 1. Project ID
    if (filters.projectId && task.project_id !== filters.projectId) {
      return false;
    }

    // 2. Assignee ID
    if (filters.assigneeId) {
      const hasAssignee = task.assignees?.some((a) => a.id === filters.assigneeId);
      if (!hasAssignee) return false;
    }

    // 3. Team ID (matches if any assignee of the task is in the member list of the team)
    if (filters.teamId && teamMemberIdsList && teamMemberIdsList.length > 0) {
      const hasTeamMemberAssigned = task.assignees?.some((a) => teamMemberIdsList.includes(a.id));
      if (!hasTeamMemberAssigned) return false;
    } else if (filters.teamId && (!teamMemberIdsList || teamMemberIdsList.length === 0)) {
      // Team is selected but has empty/no members, so no task matches
      return false;
    }

    // 4. State Group
    if (filters.stateGroup && task.state_group !== filters.stateGroup) {
      return false;
    }

    // 5. Module ID
    if (filters.moduleId) {
      const hasModule = task.modules?.some((m) => m.id === filters.moduleId);
      if (!hasModule) return false;
    }

    // 6. Label ID
    if (filters.labelId) {
      const hasLabel = task.labels?.some((l) => l.id === filters.labelId);
      if (!hasLabel) return false;
    }

    // 7. Date Bounds (falls between Plane Created design date or plane completed date)
    if (filters.startDate) {
      const start = dayjs(filters.startDate);
      const comparisonDate = task.completed_at ? dayjs(task.completed_at) : dayjs(task.plane_created_at);
      if (comparisonDate.isBefore(start, "day")) {
        return false;
      }
    }

    if (filters.endDate) {
      const end = dayjs(filters.endDate);
      const comparisonDate = task.completed_at ? dayjs(task.completed_at) : dayjs(task.plane_created_at);
      if (comparisonDate.isAfter(end, "day")) {
        return false;
      }
    }

    return true;
  });
}
