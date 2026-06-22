import { z } from "zod";

// StateGroup enum schema
export const StateGroupSchema = z.enum(["backlog", "unstarted", "started", "completed", "cancelled"]);

// Priority schema
export const PrioritySchema = z.enum(["none", "low", "medium", "high", "urgent"]);

// Zod schemas for CSV validation and entities validation

// This matches one row parsed from plane CSV file.
export const PlaneCsvRowSchema = z.object({
  "Project Name": z.string().trim().min(1),
  "Project Identifier": z.string().trim().min(1),
  "Identifier": z.string().trim().min(1),
  "Sequence Id": z.preprocess((val) => Number(val), z.number()).optional(),
  "Parent": z.string().trim().nullable().optional(),
  "Name": z.string().trim().default(""),
  "State Name": z.string().trim().min(1),
  "Priority": z.string().toLowerCase().default("none"),
  "Assignees": z.string().trim().default("[]"),
  "Subscribers": z.string().trim().default("[]"),
  "Created By Name": z.string().trim().default(""),
  "Start Date": z.string().trim().nullable().optional(),
  "Target Date": z.string().trim().nullable().optional(),
  "Completed At": z.string().trim().nullable().optional(),
  "Created At": z.string().trim().min(1),
  "Updated At": z.string().trim().min(1),
  "Archived At": z.string().trim().nullable().optional(),
  "Estimate": z.preprocess((val) => (val ? Number(val) : null), z.number().nullable()).optional(),
  "Labels": z.string().trim().default("[]"),
  "Cycles": z.string().trim().default("[]"),
  "Modules": z.string().trim().default("[]"),
  "Comments": z.string().trim().default("[]"),
  "Is Draft": z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
}).passthrough(); // Allow any other raw fields

// Schema for Allocations editing in ScrumLens
export const AllocationFormSchema = z.object({
  project_id: z.string().uuid("انتخاب پروژه الزامی است"),
  category_id: z.string().uuid("انتخاب دسته‌بندی کار الزامی است"),
  agreed_hours: z.preprocess((val) => Number(val), z.number().min(0, "ساعات کارکرد باید مثبت باشد")),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, "فرمت ماه باید YYYY-MM باشد"),
  notes: z.string().optional(),
  owner_person_ids: z.array(z.string().uuid()).optional(),
  owner_team_ids: z.array(z.string().uuid()).optional(),
});

// Schema for State Mapping editing
export const StateMappingFormSchema = z.object({
  state_name: z.string().min(1, "نام وضعیت الزامی است"),
  state_group: StateGroupSchema,
});

// Schema for Work Category
export const WorkCategoryFormSchema = z.object({
  name: z.string().min(1, "نام دسته‌بندی الزامی است"),
});

// Schema for merge profiles
export const MergePeopleSchema = z.object({
  primary_person_id: z.string().uuid(),
  duplicate_person_id: z.string().uuid(),
});
