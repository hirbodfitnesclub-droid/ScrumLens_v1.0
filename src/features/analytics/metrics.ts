import dayjs, { daysDifference } from "../../lib/dayjs";
import { Task, Allocation, StateGroup } from "../../types/domain";

export interface StateGroupCount {
  backlog: number;
  unstarted: number;
  started: number;
  completed: number;
  cancelled: number;
}

export interface MetricSummary {
  totalCount: number;
  stateDistribution: StateGroupCount;
  backlogSize: number;
  unassignedCount: number;
  delayedCount: number;
  staleCount: number;
  averageCycleTimeDays: number | null; // null if insufficient data
  cycleTimeValidCount: number;
}

/**
 * Calculates a complete metric summary from an array of tasks
 */
export function calculateMetricSummary(tasks: Task[]): MetricSummary {
  const activeTasks = tasks.filter(t => t.sync_status === "active");
  const totalCount = activeTasks.length;

  const stateDistribution = {
    backlog: 0,
    unstarted: 0,
    started: 0,
    completed: 0,
    cancelled: 0,
  };

  let backlogSize = 0;
  let unassignedCount = 0;
  let delayedCount = 0;
  let staleCount = 0;
  let totalCycleTimeDays = 0;
  let cycleTimeValidCount = 0;

  const now = dayjs();

  activeTasks.forEach((task) => {
    // 1. State group distribution
    const group = task.state_group || "unstarted";
    if (Object.prototype.hasOwnProperty.call(stateDistribution, group)) {
      stateDistribution[group]++;
    } else {
      stateDistribution.unstarted++;
    }

    // 2. Backlog size
    if (group === "backlog") {
      backlogSize++;
    }

    // 3. Unassigned count
    if (!task.assignees || task.assignees.length === 0) {
      unassignedCount++;
    }

    // 4. Delayed count
    // target_date < today AND state_group is started, unstarted, backlog
    if (task.target_date && group !== "completed" && group !== "cancelled") {
      const target = dayjs(task.target_date);
      if (target.isBefore(now, "day")) {
        delayedCount++;
      }
    }

    // 5. Stale count
    // State is 'started', and updated_at is older than 7 days
    if (group === "started" && task.plane_updated_at) {
      const updateDate = dayjs(task.plane_updated_at);
      if (now.diff(updateDate, "day") > 7) {
        staleCount++;
      }
    }

    // 6. Cycle time calculation
    if (task.completed_at && task.plane_created_at) {
      const created = dayjs(task.plane_created_at);
      const completed = dayjs(task.completed_at);
      const diff = completed.diff(created, "day");
      if (diff >= 0) {
        totalCycleTimeDays += diff;
        cycleTimeValidCount++;
      }
    }
  });

  const averageCycleTimeDays = cycleTimeValidCount > 0 
    ? Math.round((totalCycleTimeDays / cycleTimeValidCount) * 10) / 10 
    : null;

  return {
    totalCount,
    stateDistribution,
    backlogSize,
    unassignedCount,
    delayedCount,
    staleCount,
    averageCycleTimeDays,
    cycleTimeValidCount,
  };
}

/**
 * Groups active tasks by active projects
 */
export function getTasksByProject(tasks: Task[]) {
  const activeTasks = tasks.filter(t => t.sync_status === "active");
  const projectMap: Record<string, { id: string; name: string; identifier: string; tasks: Task[] }> = {};

  activeTasks.forEach((task) => {
    const projId = task.project_id;
    if (!projId) return;

    if (!projectMap[projId]) {
      projectMap[projId] = {
        id: projId,
        name: task.project?.name || "نامشخص",
        identifier: task.plane_identifier.split("-")[0] || "",
        tasks: [],
      };
    }
    projectMap[projId].tasks.push(task);
  });

  return Object.values(projectMap).map(p => {
    const summary = calculateMetricSummary(p.tasks);
    return {
      projectId: p.id,
      projectName: p.name,
      projectIdentifier: p.identifier,
      summary,
      totalCount: p.tasks.length,
    };
  });
}

/**
 * Groups active tasks by assignees (people)
 */
export function getTasksByAssignee(tasks: Task[]) {
  const activeTasks = tasks.filter(t => t.sync_status === "active");
  const assigneeMap: Record<string, { id: string; name: string; role: string; avatarColor?: string; tasks: Task[] }> = {};
  const unassignedTasks: Task[] = [];

  activeTasks.forEach((task) => {
    if (!task.assignees || task.assignees.length === 0) {
      unassignedTasks.push(task);
      return;
    }

    task.assignees.forEach((assignee) => {
      const id = assignee.id;
      if (!id) return;

      if (!assigneeMap[id]) {
        assigneeMap[id] = {
          id,
          name: assignee.full_name,
          role: assignee.role_title || "بدون نقش",
          avatarColor: assignee.avatar_color,
          tasks: [],
        };
      }
      assigneeMap[id].tasks.push(task);
    });
  });

  const list = Object.values(assigneeMap).map(a => {
    const summary = calculateMetricSummary(a.tasks);
    return {
      personId: a.id,
      name: a.name,
      role: a.role,
      avatarColor: a.avatarColor,
      summary,
      totalCount: a.tasks.length,
    };
  });

  // Sort by task load descending
  list.sort((a, b) => b.totalCount - a.totalCount);

  return {
    byAssignee: list,
    unassigned: {
      name: "بدون مسئول (unassigned)",
      summary: calculateMetricSummary(unassignedTasks),
      totalCount: unassignedTasks.length,
      tasks: unassignedTasks
    }
  };
}

/**
 * Calculates throughput over a list of completed dates
 */
export function getThroughputStatistics(tasks: Task[], unit: "week" | "month" = "week") {
  const completedTasks = tasks.filter(t => t.sync_status === "active" && t.state_group === "completed" && t.completed_at);
  const throughputMap: Record<string, number> = {};

  completedTasks.forEach((task) => {
    const completedDate = dayjs(task.completed_at);
    // Group key based on week or month
    const key = unit === "week" 
      ? completedDate.startOf("week").format("YYYY/MM/DD")
      : completedDate.format("YYYY/MM");

    throughputMap[key] = (throughputMap[key] || 0) + 1;
  });

  // Convert map to sorted list
  const list = Object.entries(throughputMap).map(([period, count]) => ({
    period,
    count,
  }));
  
  list.sort((a, b) => a.period.localeCompare(b.period));
  return list;
}

/**
 * Calculates comparison list: Agreed capacity hours vs Count of active tasks
 */
export function getAgreedCapacityVsTasks(tasks: Task[], allocations: Allocation[]) {
  // Aggregate allocations by project
  const projectAgreedMap: Record<string, { name: string; hours: number; tasksCount: number }> = {};
  
  allocations.forEach(a => {
    const projId = a.project_id;
    if (!projId) return;
    
    if (!projectAgreedMap[projId]) {
      projectAgreedMap[projId] = {
        name: a.project?.name || "نامشخص",
        hours: 0,
        tasksCount: 0
      };
    }
    projectAgreedMap[projId].hours += Number(a.agreed_hours) || 0;
  });

  // Calculate task distribution for matching projects
  const activeTasks = tasks.filter(t => t.sync_status === "active" && t.state_group !== "completed" && t.state_group !== "cancelled");
  activeTasks.forEach(task => {
    const projId = task.project_id;
    if (projId && projectAgreedMap[projId]) {
      projectAgreedMap[projId].tasksCount++;
    }
  });

  return Object.entries(projectAgreedMap).map(([projectId, data]) => ({
    projectId,
    projectName: data.name,
    agreedHours: data.hours,
    activeTasksCount: data.tasksCount,
  }));
}
