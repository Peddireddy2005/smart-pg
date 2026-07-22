import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutGrid, KeyRound, Building2, Menu, Power } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { clearSession, getSession } from "../services/authService";

const links = [
  { to: "/admin/dashboard", icon: LayoutGrid, label: "Platform Overview" },
  { to: "/admin/owners", icon: KeyRound, label: "Owners" },
  { to: "/admin/pgs", icon: Building2, label: "All PGs" },
];

export default function AdminLayout() {
  const user = getSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f4] dark:bg-slate-900">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-60 bg-slate-950 flex flex-col shrink-0
        transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
          <span className="text-white font-heading font-bold text-lg">Smart PG Admin</span>
        </div>
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-slate-400 text-xs">Platform Admin</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-white/10">
          <button onClick={logout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <Power size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto w-full">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <ThemeToggle dark={false} />
        </div>
        <div className="p-4 md:p-8 page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
}