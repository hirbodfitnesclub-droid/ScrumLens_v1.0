import { useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  UploadCloud, 
  Layers, 
  Users, 
  UserSquare2, 
  CalendarCheck, 
  FileSpreadsheet, 
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "overview", label: "داشبورد اصلی", path: "/", icon: LayoutDashboard },
    { id: "import", label: "درون‌ریزی فایل Plane", path: "/import", icon: UploadCloud },
    { id: "projects", label: "پروژه‌ها", path: "/projects", icon: Layers },
    { id: "teams", label: "تیم‌ها", path: "/teams", icon: Users },
    { id: "people", label: "افراد و اعضا", path: "/people", icon: UserSquare2 },
    { id: "allocations", label: "تعهدات و ظرفیت", path: "/allocations", icon: CalendarCheck },
    { id: "reports", label: "گزارش‌دهی و اکسل", path: "/reports", icon: FileSpreadsheet },
    { id: "settings", label: "تنظیمات وضعیت‌ها", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "fixed top-0 right-0 z-40 h-screen w-72 border-l border-muted-light/60 bg-white p-6 flex flex-col justify-between shadow-[2px_0_15px_rgba(0,0,0,0.01)]",
        className
      )}
    >
      <div>
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-ink flex items-center justify-center text-accent shadow-md">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">ScrumLens</h1>
            <p className="text-xs font-semibold text-muted-text">دید‌بان تحلیلی اسکرام</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5 list-none pr-0">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group cursor-pointer",
                    isActive 
                      ? "text-ink font-bold bg-accent/20" 
                      : "text-muted-text hover:text-ink hover:bg-muted-light/20"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute right-0 top-3 bottom-3 w-1 rounded-l-full bg-ink"
                    />
                  )}
                  <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-105", isActive ? "text-ink" : "text-muted-text")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile and Logout */}
      <div className="border-t border-muted-light/40 pt-4 flex flex-col gap-3">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 bg-muted-light/10 rounded-2xl border border-muted-light/20">
            <div className="h-10 w-10 rounded-full bg-ink text-accent flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink truncate">{user.name}</p>
              <p className="text-xs text-muted-text truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors group cursor-pointer"
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          <span>خروج از حساب</span>
        </button>
      </div>
    </aside>
  );
}
