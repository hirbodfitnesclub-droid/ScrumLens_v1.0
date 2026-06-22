import React from "react";
import AppShell from "../components/layout/AppShell";
import StateGroupMappingList from "../components/settings/StateGroupMappingList";
import WorkCategoriesList from "../components/settings/WorkCategoriesList";
import PeopleManager from "../components/settings/PeopleManager";
import { Settings as SettingsIcon, Layers, Briefcase, Users, LayoutList } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

type TabId = "state-groups" | "work-categories" | "people";

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState<TabId>("state-groups");

  const tabs = [
    { id: "state-groups", label: "نگاشت وضعیت‌ها", icon: Layers, description: "اتصال وضعیت‌های فایل Plane به دسته‌های اسکرام" },
    { id: "work-categories", label: "دسته‌های کاری", icon: Briefcase, description: "تعریف دسته‌بندی‌های عملیاتی برای ظرفیت‌ها" },
    { id: "people", label: "مدیریت اعضا و ادغام", icon: Users, description: "ویرایش پروفایل تیمی و ادغام نام‌های تکراری" },
  ] as const;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-ink">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">تنظیمات سیستم</h1>
            <p className="text-xs font-semibold text-muted-text">
              پیکربندی تیمی، دسته‌بندی‌های فعالیت‌های ورکلود و نگاشت وضعیت‌های ستون‌ها
            </p>
          </div>
        </div>

        {/* Tab Switcher Headers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer text-right group",
                  isActive
                    ? "bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    : "hover:bg-slate-100/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-active"
                    className="absolute inset-0 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-colors shrink-0",
                    isActive ? "bg-accent/20 text-ink" : "bg-slate-200/50 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="min-w-0">
                  <p className={cn("text-xs font-black", isActive ? "text-ink" : "text-slate-600 group-hover:text-ink")}>
                    {tab.label}
                  </p>
                  <p className="text-[10px] text-muted-text truncate">{tab.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Frame with smooth transitions */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.015)] p-6 min-h-[350px]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "state-groups" && <StateGroupMappingList />}
            {activeTab === "work-categories" && <WorkCategoriesList />}
            {activeTab === "people" && <PeopleManager />}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
