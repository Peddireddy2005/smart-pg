import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutGrid, Home, QrCode, Wallet, Flag, Megaphone, CircleUser, Menu, X, Power,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { logout, getSession } from "../services/authService";

const links = [
  { to: "/resident/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/resident/room", icon: Home, label: "My Room" },
  { to: "/resident/join", icon: QrCode, label: "Join a PG" },
  { to: "/resident/payments", icon: Wallet, label: "Payments" },
  { to: "/resident/complaints", icon: Flag, label: "Complaints" },
  { to: "/resident/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/resident/profile", icon: CircleUser, label: "My Profile" },
];

export default function ResidentLayout() {
  const user = getSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2FCFA]">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-[#C7F0EA] flex flex-col shrink-0
        transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="h-16 px-4 border-b border-[#C7F0EA] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">S</div>
            <span className="text-ink-900 font-heading font-bold text-lg">Smart PG</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-ink-900 hover:bg-slate-100" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-4 border-b border-[#C7F0EA]">
          <p className="text-ink-900 text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-slate-400 text-xs">Resident</p>
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto sidebar-scroll">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="block">
              {({ isActive }) => (
                <div className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                  ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-ink-900 hover:bg-slate-50"}`}>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-500" />}
                  <Icon size={19} className="shrink-0" />
                  <span>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-2.5 py-3 border-t border-[#C7F0EA]">
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Power size={19} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-gray-100 bg-white">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
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