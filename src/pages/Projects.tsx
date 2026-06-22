import React from "react";
import AppShell from "../components/layout/AppShell";
import ProjectCard from "../components/projects/ProjectCard";
import EmptyState from "../components/common/EmptyState";
import { useProjects } from "../data/projects";
import { useTasks } from "../data/tasks";
import { Tabs } from "../components/ui/Tabs";
import { Project, Task } from "../types/domain";
import { Folder, Search, FolderGit2 } from "lucide-react";

export default function Projects() {
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"active" | "archived">("active");

  const filteredProjects = React.useMemo<Project[]>(() => {
    let result = projects;
    
    // 1. Status tab filter
    result = result.filter((p) => p.status === activeTab);

    // 2. Search query filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.plane_identifier.toLowerCase().includes(term)
      );
    }

    return result;
  }, [projects, activeTab, searchTerm]);

  const tabsList = React.useMemo(() => [
    { id: "active", label: `پروژه‌های فعال (${projects.filter((p) => p.status === "active").length})` },
    { id: "archived", label: `بایگانی شده (${projects.filter((p) => p.status === "archived").length})` }
  ], [projects]);

  const isLoading = isProjectsLoading || isTasksLoading;

  return (
    <AppShell>
      <div className="space-y-6 text-right" dir="rtl">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-5 space-y-1.5 select-none">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-slate-800" />
            <h1 className="text-2xl font-black text-ink">پروژه‌های دیجیتال آژانس</h1>
          </div>
          <p className="text-xs text-muted-text font-semibold">
            مشاهده وضعیت اسکرام، بارکاری کل و میزان همترازی هر پروژه فنی در پورتفولیوی آژانس دیجیتال مارکتینگ.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50 border border-slate-100/80 p-4 rounded-3xl">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی نام یا پیشوند پروژه..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs font-semibold bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* New Custom Tabs List */}
          <Tabs
            tabs={tabsList}
            activeTab={activeTab}
            onChange={(val) => setActiveTab(val as "active" | "archived")}
          />
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white h-56 rounded-3xl border border-slate-100" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="پروژه‌ای پیدا نشد"
            description="هیچ پروژه‌ای مطابق معیارهای جستجو یا فیلتر وضعیت انتخابی شما کشف نشد."
            icon={Folder}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => {
              const ProjectCardElement = ProjectCard as any;
              return (
                <ProjectCardElement
                  key={p.id}
                  project={p}
                  projectTasks={tasks.filter((t: Task) => t.project_id === p.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
