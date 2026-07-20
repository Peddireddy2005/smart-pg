import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import NotificationBell from "../components/NotificationBell";
import GlobalSearch from "../components/GlobalSearch";
import ThemeToggle from "../components/ThemeToggle";
import { clearSession, getSession } from "../services/authService";

const links = [
  { to: "/owner/dashboard", icon: "⊞", label: "Dashboard" },
  { to: "/owner/analytics", icon: "📊", label: "Analytics" },
  { to: "/pgs", icon: "🔍", label: "Browse PGs" },
  { to: "/owner/payments", icon: "₹", label: "Payments" },
  { to: "/owner/complaints", icon: "⚑", label: "Complaints" },
  { to: "/owner/announcements", icon: "📣", label: "Announcements" },
  { to: "/owner/staff", icon: "🧑‍🔧", label: "Staff" },
  { to: "/owner/visitors", icon: "🚪", label: "Visitors" },
  { to: "/owner/expenses", icon: "💸", label: "Expenses" },
  { to: "/owner/inventory", icon: "📦", label: "Inventory" },
  { to: "/owner/reports", icon: "📄", label: "Reports" },
  { to: "/owner/activity-logs", icon: "🕒", label: "Activity Logs" },
  { to: "/owner/settings", icon: "⚙️", label: "Settings" },
];

export default function OwnerLayout() {
  const user = getSession();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f4] dark:bg-slate-900">
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-slate-950 flex flex-col transition-all duration-300 shrink-0`}>
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
                <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
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
        <div className="flex items-center justify-between gap-4 px-6 md:px-8 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <GlobalSearch />
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle dark={false} />
            <NotificationBell dark={false} />
          </div>
        </div>
        <div className="p-6 md:p-8 page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
}