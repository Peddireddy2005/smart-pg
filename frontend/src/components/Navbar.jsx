import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { getSession, clearSession } from "../services/authService";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sync = () => setUser(getSession());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [location.pathname]);

  if (location.pathname.startsWith("/owner") || location.pathname.startsWith("/resident") || location.pathname.startsWith("/admin")) {
    return null;
  }

  const logout = () => {
    clearSession();
    setUser(null);
    navigate("/");
  };

  const openDashboard = () => {
    if (!user) return navigate("/login");
    navigate(user.role === "owner" ? "/owner/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/resident/dashboard");
  };

  return (
    <nav className="bg-paper-raised dark:bg-ink-950 border-b border-[#DAD4C4] dark:border-ink-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ink-900 text-paper flex items-center justify-center font-heading font-semibold text-sm">S</div>
          <span className="font-heading text-xl font-semibold text-ink-900 dark:text-paper">Smart PG</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/pgs" className="text-ink-400 dark:text-ink-100 hover:text-brand-500 font-medium text-sm hidden sm:block">
            Browse PGs
          </Link>

          <ThemeToggle dark={false} />

          {!user ? (
            <>
              <Link to="/login" className="text-ink-400 dark:text-ink-100 hover:text-brand-500 font-medium text-sm">Login</Link>
              <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            </>
          ) : (
            <>
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[#DAD4C4]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={openDashboard} className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5">
                <LayoutGrid size={15} /> Dashboard
              </button>
              <button onClick={logout} className="btn-secondary text-sm py-2 px-4">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}