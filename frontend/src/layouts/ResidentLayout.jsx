import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";
import { clearSession, getSession } from "../services/authService";

export default function ResidentLayout() {
  const user = getSession();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: "/resident/dashboard", icon: "⊞", label: "Dashboard" },
    { to: "/resident/room", icon: "🏠", label: "My Room" },
    ...(user?.assignedPG ? [] : [{ to: "/resident/join", icon: "🔗", label: "Join a PG" }]),
    { to: "/resident/pg-listings", icon: "🔍", label: "Browse PGs" },
    { to: "/resident/payments", icon: "₹", label: "Rent" },
    { to: "/resident/complaints", icon: "⚑", label: "Complaints" },
    { to: "/resident/announcements", icon: "📣", label: "Announcements" },
    { to: "/resident/profile", icon: "◉", label: "My Profile" },
  ];

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f4] dark:bg-slate-900">
      <aside className={`${collapsed ? "w-16" : "w-60"} bg-slate-950 flex flex-col transition-all duration-300 shrink-0`}>
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">S</div>
          {!collapsed && <span className="text-white font-heading font-bold text-lg">Smart PG</span>}
        </div>

        {!collapsed && (
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs">Resident</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="text-lg w-5 text-center shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-white/10 space-y-1">
          <button onClick={() => setCollapsed(!collapsed)} className="sidebar-link w-full">
            <span className="text-lg w-5 text-center shrink-0">{collapsed ? "→" : "←"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
          <button onClick={logout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <span className="text-lg w-5 text-center shrink-0">⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-end gap-2 px-6 md:px-8 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ThemeToggle dark={false} />
          <NotificationBell dark={false} />
        </div>
        <div className="p-6 md:p-8 page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
}