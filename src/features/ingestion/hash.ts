import { CanonicalTask } from "./normalize";

function cyrb128(str: string): string {
  let h1 = 1779033703, h2 = 302473432, h3 = 3362453611, h4 = 50249325;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h3 >>> 0).toString(16).padStart(8, "0") +
    (h4 >>> 0).toString(16).padStart(8, "0")
  );
}

/**
 * Calculates a 32-character stable hash from all meaningful, editable fields of a CanonicalTask.
 * Excludes plane_updated_at since that changes even when there is no content change.
 */
export function calculateTaskHash(task: CanonicalTask): string {
  const sortedAssignees = [...task.assignees]
    .map((a) => a.normalized_name)
    .sort()
    .join(",");
  const sortedLabels = [...task.labels]
    .map((l) => l.name)
    .sort()
    .join(",");
  const sortedModules = [...task.modules].sort().join(",");
  const sortedCycles = [...task.cycles].sort().join(",");

  const meaningfulFields = [
    task.plane_identifier,
    task.name,
    task.state_name,
    task.state_group,
    task.priority,
    task.parent_identifier || "",
    task.start_date || "",
    task.target_date || "",
    task.completed_at || "",
    task.estimate === null ? "" : task.estimate.toString(),
    task.is_draft ? "1" : "0",
    sortedAssignees,
    sortedLabels,
    sortedModules,
    sortedCycles,
  ];

  const payloadString = meaningfulFields.join("##");
  return cyrb128(payloadString);
}
