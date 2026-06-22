import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import ImportPage from "./pages/ImportPage";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import People from "./pages/People";
import PersonProfile from "./pages/PersonProfile";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Allocations from "./pages/Allocations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Overview />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/people" element={<People />} />
      <Route path="/people/:id" element={<PersonProfile />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/teams/:id" element={<TeamDetail />} />
      <Route path="/allocations" element={<Allocations />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Overview />} />
    </Routes>
  );
}
