import { Outlet, NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { clearSession, getSession } from "../services/authService";

const links = [
  { to: "/admin/dashboard", icon: "⊞", label: "Platform Overview" },
  { to: "/admin/owners", icon: "🔑", label: "Owners" },
  { to: "/admin/pgs", icon: "🏘️", label: "All PGs" },
];

// Minimal platform-level admin panel — spec §27 explicitly marks this
// section "(Future)"; kept read-only/basic on purpose.
export default function AdminLayout() {
  const user = getSession();
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f4] dark:bg-slate-900">
      <aside className="w-60 bg-slate-950 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
          <span className="text-white font-heading font-bold text-lg">Smart PG Admin</span>
        </div>
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-slate-400 text-xs">Platform Admin</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="text-lg w-5 text-center shrink-0">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-white/10">
          <button onClick={logout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <span className="text-lg w-5 text-center shrink-0">⏻</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-end px-6 md:px-8 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ThemeToggle dark={false} />
        </div>
        <div className="p-6 md:p-8 page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
