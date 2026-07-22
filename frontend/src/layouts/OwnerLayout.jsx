import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutGrid, BarChart3, Search, IndianRupee, Flag, Megaphone, Wrench,
  DoorOpen, Wallet, FileText, History, Settings, Menu, X, ChevronLeft, ChevronRight, Power,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import GlobalSearch from "../components/GlobalSearch";
import ThemeToggle from "../components/ThemeToggle";
import { clearSession, getSession } from "../services/authService";

const links = [
  { to: "/owner/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/owner/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/owner/pg-listings", icon: Search, label: "Browse PGs" },
  { to: "/owner/payments", icon: IndianRupee, label: "Payments" },
  { to: "/owner/complaints", icon: Flag, label: "Complaints" },
  { to: "/owner/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/owner/staff", icon: Wrench, label: "Staff" },
  { to: "/owner/vacated", icon: DoorOpen, label: "Vacated Residents" },
  { to: "/owner/expenses", icon: Wallet, label: "Expenses" },
  { to: "/owner/reports", icon: FileText, label: "Reports" },
  { to: "/owner/activity-logs", icon: History, label: "Activity Logs" },
  { to: "/owner/settings", icon: Settings, label: "Settings" },
];

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink to={to} className="block">
      {({ isActive }) => (
        <div
          className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors
            ${collapsed ? "justify-center px-0" : "px-3"}
            ${isActive ? "bg-white/[0.08] text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-500" />
          )}
          <Icon size={19} strokeWidth={2} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
              {label}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

export default function OwnerLayout() {
  const user = getSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
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

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 ${collapsed ? "md:w-[76px]" : "md:w-64"}
          bg-slate-950 flex flex-col shrink-0 transition-transform md:transition-[width] duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className={`h-16 px-4 border-b border-white/10 flex items-center shrink-0 ${collapsed ? "md:justify-center md:px-2" : "justify-between"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">S</div>
            {!collapsed && <span className="text-white font-heading font-bold text-lg truncate">Smart PG</span>}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0 ${collapsed ? "md:hidden" : ""}`}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden md:flex items-center justify-center py-2.5 text-slate-500 hover:text-white transition border-b border-white/10"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <div className={`px-4 py-4 border-b border-white/10 ${collapsed ? "md:px-2 md:flex md:justify-center" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "md:gap-0" : ""}`}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto overflow-x-visible">
          {links.map((l) => <NavItem key={l.to} {...l} collapsed={collapsed} />)}
        </nav>

        <div className="px-2.5 py-3 border-t border-white/10">
          <button
            onClick={logout}
            className={`group relative flex items-center gap-3 rounded-xl py-2.5 w-full text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          >
            <Power size={19} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block flex-1 min-w-0">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle dark={false} />
            <NotificationBell dark={false} />
          </div>
        </div>
        <div className="p-4 md:p-8 page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
}