import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { ReconciliationResult } from "./reconcile";
import { CanonicalTask } from "./normalize";
import { calculateTaskHash } from "./hash";
import { 
  getLocalTasks, 
  saveLocalTasks 
} from "../../data/tasks";
import { 
  getLocalImports, 
  saveLocalImports, 
  getLocalChanges, 
  saveLocalChanges 
} from "../../data/imports";
import { getLocalComments, saveLocalComments } from "../../data/comments";
import { Task, Project, Person, Label, Module, Cycle, Comment, ImportRun, TaskChange } from "../../types/domain";

/**
 * Persists the validated, reconciled Import batch into the storage.
 * Supports cloud Supabase transaction-esque sequence or local offline sandbox.
 */
export async function persistImport(
  fileName: string,
  reconcileResult: ReconciliationResult,
  originalRowsCount: number
): Promise<string> {
  const { added, updated, removed, restored } = reconcileResult;

  if (!isSupabaseConfigured) {
    // ----------------- OFFLINE MEMORY PERSISTENCE -----------------
    const localTasks = getLocalTasks();
    const localImports = getLocalImports();
    const localChanges = getLocalChanges();
    const localComments = getLocalComments();

    // Load or bootstrap offline lists
    const storedProjects = localStorage.getItem("scrumlens_offline_projects");
    const localProjects: Project[] = storedProjects ? JSON.parse(storedProjects) : [];
    
    const storedPeople = localStorage.getItem("scrumlens_offline_people");
    const localPeople: Person[] = storedPeople ? JSON.parse(storedPeople) : [];

    const importId = crypto.randomUUID();

    // 1. Process Projects
    const allIncomingTasks = [...added, ...updated.map(u => u.task)];
    allIncomingTasks.forEach(task => {
      let extProj = localProjects.find(p => p.plane_identifier === task.project_identifier);
      if (!extProj) {
        extProj = {
          id: crypto.randomUUID(),
          user_id: "offline-user",
          plane_identifier: task.project_identifier,
          name: task.project_name,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          status: "active"
        };
        localProjects.push(extProj);
      }
    });
    localStorage.setItem("scrumlens_offline_projects", JSON.stringify(localProjects));

    // 2. Process People
    allIncomingTasks.forEach(task => {
      // Creator
      if (task.created_by_name) {
        let norm = task.created_by_name.trim().toLowerCase();
        let extP = localPeople.find(p => p.normalized_name === norm);
        if (!extP) {
          localPeople.push({
            id: crypto.randomUUID(),
            user_id: "offline-user",
            full_name: task.created_by_name,
            normalized_name: norm,
            aliases: [],
            is_active: true,
            avatar_color: "bg-slate-800 text-slate-100"
          });
        }
      }
      // Assignees
      task.assignees.forEach(as => {
        let extP = localPeople.find(p => p.normalized_name === as.normalized_name);
        if (!extP) {
          localPeople.push({
            id: crypto.randomUUID(),
            user_id: "offline-user",
            full_name: as.full_name,
            normalized_name: as.normalized_name,
            aliases: [],
            is_active: true,
            avatar_color: "bg-accent text-ink"
          });
        }
      });
    });
    localStorage.setItem("scrumlens_offline_people", JSON.stringify(localPeople));

    // 3. Process Tasks
    // Process Restored ones
    restored.forEach(rest => {
      const dbTask = localTasks.find(t => t.id === rest.id);
      if (dbTask) {
        dbTask.sync_status = "active";
        dbTask.last_seen_import = importId;
        dbTask.last_seen_at = new Date().toISOString();
      }
    });

    // Process Removed ones
    removed.forEach(rem => {
      const dbTask = localTasks.find(t => t.id === rem.id);
      if (dbTask) {
        dbTask.sync_status = "deleted";
      }
    });

    // Process Added ones
    added.forEach(add => {
      const projId = localProjects.find(p => p.plane_identifier === add.project_identifier)?.id || "general-proj";
      const taskHash = calculateTaskHash(add);
      
      const newTaskObj: Task = {
        id: crypto.randomUUID(),
        user_id: "offline-user",
        project_id: projId,
        plane_identifier: add.plane_identifier,
        sequence_id: add.sequence_id,
        parent_identifier: add.parent_identifier || undefined,
        name: add.name,
        state_name: add.state_name,
        state_group: add.state_group,
        priority: add.priority,
        created_by_name: add.created_by_name,
        start_date: add.start_date || undefined,
        target_date: add.target_date || undefined,
        completed_at: add.completed_at || undefined,
        plane_created_at: add.plane_created_at,
        plane_updated_at: add.plane_updated_at,
        archived_at: add.archived_at || undefined,
        estimate: add.estimate || undefined,
        is_draft: add.is_draft,
        sync_status: "active",
        content_hash: taskHash,
        first_seen_import: importId,
        last_seen_import: importId,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      };
      localTasks.push(newTaskObj);

      // Comments pusher
      add.comments.forEach(c => {
        localComments.push({
          id: crypto.randomUUID(),
          user_id: "offline-user",
          task_id: newTaskObj.id,
          author_name: c.author_name,
          body: c.body,
          plane_created_at: c.plane_created_at,
          content_hash: c.author_name + "##" + c.body.substring(0, 50)
        });
      });
    });

    // Process Updated ones
    updated.forEach(upd => {
      const dbTask = localTasks.find(t => t.id === upd.existingId);
      if (dbTask) {
        const taskHash = calculateTaskHash(upd.task);
        dbTask.name = upd.task.name;
        dbTask.state_name = upd.task.state_name;
        dbTask.state_group = upd.task.state_group;
        dbTask.priority = upd.task.priority;
        dbTask.parent_identifier = upd.task.parent_identifier || undefined;
        dbTask.start_date = upd.task.start_date || undefined;
        dbTask.target_date = upd.task.target_date || undefined;
        dbTask.completed_at = upd.task.completed_at || undefined;
        dbTask.estimate = upd.task.estimate || undefined;
        dbTask.is_draft = upd.task.is_draft;
        dbTask.content_hash = taskHash;
        dbTask.last_seen_import = importId;
        dbTask.last_seen_at = new Date().toISOString();

        // Log Change Audit
        localChanges.push({
          id: crypto.randomUUID(),
          user_id: "offline-user",
          import_id: importId,
          task_id: dbTask.id,
          plane_identifier: dbTask.plane_identifier,
          change_type: "updated",
          field_diffs: upd.fieldDiffs
        });
      }
    });

    saveLocalTasks(localTasks);
    saveLocalComments(localComments);
    saveLocalChanges(localChanges);

    // Write Import Log
    const mockSummary = {
      added: added.length,
      updated: updated.length,
      removed: removed.length,
      restored: restored.length,
      unchanged: reconcileResult.unchanged.length
    };
    localImports.push({
      id: importId,
      user_id: "offline-user",
      file_name: fileName,
      imported_at: new Date().toISOString(),
      row_count: originalRowsCount,
      summary: mockSummary
    });
    saveLocalImports(localImports);

    return importId;
  }

  // ----------------- ONLINE SUPABASE CLOUD SQL TRANSACTIONS -----------------
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ورود به سیستم الزامی است");

  // Create an explicit import ID
  const { data: importObj, error: importErr } = await supabase
    .from("imports")
    .insert({
      file_name: fileName,
      user_id: user.id,
      row_count: originalRowsCount,
      summary: {
        added: added.length,
        updated: updated.length,
        removed: removed.length,
        restored: restored.length,
        unchanged: reconcileResult.unchanged.length
      }
    })
    .select()
    .single();

  if (importErr) throw importErr;
  const importId = importObj.id;

  // 1. Persist Projects
  const allIncomingTasks = [...added, ...updated.map(u => u.task)];
  const uniqueProjectsMap = new Map<string, string>(); // name to identifier
  allIncomingTasks.forEach(t => {
    uniqueProjectsMap.set(t.project_identifier, t.project_name);
  });

  for (const [planeIdentifier, projectName] of uniqueProjectsMap.entries()) {
    await supabase.from("projects").upsert({
      plane_identifier: planeIdentifier,
      name: projectName,
      user_id: user.id
    }, { onConflict: "user_id,plane_identifier" });
  }

  // Get project mappings (Identifier to ID)
  const { data: projs, error: projsErr } = await supabase
    .from("projects")
    .select("id, plane_identifier")
    .eq("user_id", user.id);

  if (projsErr) throw projsErr;
  const projectMap = new Map<string, string>();
  projs.forEach(p => projectMap.set(p.plane_identifier, p.id));

  // 2. Persist People
  const uniqueNames = new Set<string>();
  allIncomingTasks.forEach(t => {
    if (t.created_by_name) uniqueNames.add(t.created_by_name);
    t.assignees.forEach(as => uniqueNames.add(as.full_name));
    t.subscribers.forEach(sub => uniqueNames.add(sub.full_name));
  });

  for (const pName of uniqueNames) {
    await supabase.from("people").upsert({
      full_name: pName,
      normalized_name: pName.trim().toLowerCase().replace(/\s+/g, " "),
      user_id: user.id
    }, { onConflict: "user_id,normalized_name" });
  }

  // Get people mappings
  const { data: ppl, error: pplErr } = await supabase
    .from("people")
    .select("id, normalized_name")
    .eq("user_id", user.id);

  if (pplErr) throw pplErr;
  const peopleMap = new Map<string, string>();
  ppl.forEach(p => peopleMap.set(p.normalized_name, p.id));

  // 3. Sync restored elements
  if (restored.length > 0) {
    const ids = restored.map(r => r.id);
    await supabase.from("tasks")
      .update({ 
        sync_status: "active", 
        last_seen_import: importId, 
        last_seen_at: new Date().toISOString() 
      })
      .in("id", ids);
  }

  // 4. Sync soft deleted elements
  if (removed.length > 0) {
    const ids = removed.map(r => r.id);
    await supabase.from("tasks")
      .update({ sync_status: "deleted" })
      .in("id", ids);

    // Store removed change log
    const removedChanges = removed.map(rem => ({
      import_id: importId,
      task_id: rem.id,
      plane_identifier: rem.plane_identifier,
      change_type: "removed",
      field_diffs: {},
      user_id: user.id
    }));
    await supabase.from("task_changes").insert(removedChanges);
  }

  // Helper of storing task associations (Assignees, etc.)
  const syncTaskRelations = async (id: string, incomingTask: CanonicalTask) => {
    // Sync Assignees
    await supabase.from("task_assignees").delete().eq("task_id", id);
    if (incomingTask.assignees.length > 0) {
      const records = incomingTask.assignees.map(as => ({
        task_id: id,
        person_id: peopleMap.get(as.normalized_name)!,
        user_id: user.id
      })).filter(r => r.person_id);
      if (records.length > 0) {
        await supabase.from("task_assignees").insert(records);
      }
    }

    // Sync Subscribers
    await supabase.from("task_subscribers").delete().eq("task_id", id);
    if (incomingTask.subscribers.length > 0) {
      const records = incomingTask.subscribers.map(sub => ({
        task_id: id,
        person_id: peopleMap.get(sub.normalized_name)!,
        user_id: user.id
      })).filter(r => r.person_id);
      if (records.length > 0) {
        await supabase.from("task_subscribers").insert(records);
      }
    }

    // Comments insertions
    if (incomingTask.comments.length > 0) {
      for (const comment of incomingTask.comments) {
        const commentHash = comment.author_name + "##" + comment.body.substring(0, 50);
        const personId = peopleMap.get(comment.author_name.trim().toLowerCase()) || null;
        
        await supabase.from("comments").upsert({
          task_id: id,
          author_name: comment.author_name,
          person_id: personId,
          body: comment.body,
          plane_created_at: comment.plane_created_at,
          content_hash: commentHash,
          user_id: user.id
        }, { onConflict: "user_id,task_id,content_hash" });
      }
    }
  };

  // 5. Run additions
  for (const addTask of added) {
    const projDbId = projectMap.get(addTask.project_identifier)!;
    const taskHash = calculateTaskHash(addTask);

    const { data: dbTask, error: addErr } = await supabase
      .from("tasks")
      .insert({
        project_id: projDbId,
        plane_identifier: addTask.plane_identifier,
        sequence_id: addTask.sequence_id,
        parent_identifier: addTask.parent_identifier,
        name: addTask.name,
        state_name: addTask.state_name,
        state_group: addTask.state_group,
        priority: addTask.priority,
        created_by_name: addTask.created_by_name,
        start_date: addTask.start_date,
        target_date: addTask.target_date,
        completed_at: addTask.completed_at,
        plane_created_at: addTask.plane_created_at,
        plane_updated_at: addTask.plane_updated_at,
        archived_at: addTask.archived_at,
        estimate: addTask.estimate,
        is_draft: addTask.is_draft,
        sync_status: "active",
        content_hash: taskHash,
        first_seen_import: importId,
        last_seen_import: importId,
        user_id: user.id
      })
      .select()
      .single();

    if (addErr) throw addErr;

    // Log addition audit
    await supabase.from("task_changes").insert({
      import_id: importId,
      task_id: dbTask.id,
      plane_identifier: dbTask.plane_identifier,
      change_type: "added",
      field_diffs: {},
      user_id: user.id
    });

    await syncTaskRelations(dbTask.id, addTask);
  }

  // 6. Run updates
  for (const updTask of updated) {
    const taskHash = calculateTaskHash(updTask.task);

    const { error: updErr } = await supabase
      .from("tasks")
      .update({
        name: updTask.task.name,
        state_name: updTask.task.state_name,
        state_group: updTask.task.state_group,
        priority: updTask.task.priority,
        parent_identifier: updTask.task.parent_identifier,
        start_date: updTask.task.start_date,
        target_date: updTask.task.target_date,
        completed_at: updTask.task.completed_at,
        estimate: updTask.task.estimate,
        is_draft: updTask.task.is_draft,
        content_hash: taskHash,
        last_seen_import: importId,
        last_seen_at: new Date().toISOString()
      })
      .eq("id", updTask.existingId);

    if (updErr) throw updErr;

    // Log Change Audit
    await supabase.from("task_changes").insert({
      import_id: importId,
      task_id: updTask.existingId,
      plane_identifier: updTask.task.plane_identifier,
      change_type: "updated",
      field_diffs: updTask.fieldDiffs,
      user_id: user.id
    });

    await syncTaskRelations(updTask.existingId, updTask.task);
  }

  return importId;
}
