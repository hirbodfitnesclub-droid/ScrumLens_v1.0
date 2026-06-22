import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { motion } from "motion/react";

interface AppShellProps {
  children?: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink border-t-transparent" />
          <p className="text-sm font-semibold text-muted-text">در حال بارگذاری پنل ScrumLens...</p>
        </div>
      </div>
    );
  }

  // Protect route
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink antialiased">
      {/* Right Sidebar */}
      <Sidebar />

      {/* Main Content Area (offset by sidebar width on the right) */}
      <div className="mr-72 min-h-screen flex flex-col">
        {/* Topbar */}
        <Topbar />

        {/* Content Wrapper */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1 p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
