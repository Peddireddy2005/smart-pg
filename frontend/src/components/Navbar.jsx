import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSession, clearSession } from "../services/authService";

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

  // Hide inside dashboard layouts
  if (location.pathname.startsWith("/owner") || location.pathname.startsWith("/resident")) {
    return null;
  }

  const logout = () => {
    clearSession();
    setUser(null);
    navigate("/");
  };

  const openDashboard = () => {
    if (!user) return navigate("/login");
    navigate(user.role === "owner" ? "/owner/dashboard" : "/resident/dashboard");
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm">S</div>
          <span className="font-heading text-xl font-bold text-slate-900">Smart PG</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/pgs" className="text-slate-600 hover:text-brand-500 font-medium text-sm hidden sm:block">
            Browse PGs
          </Link>

          {!user ? (
            <>
              <Link to="/login" className="text-slate-600 hover:text-brand-500 font-medium text-sm">Login</Link>
              <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            </>
          ) : (
            <>
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={openDashboard} className="btn-primary text-sm py-2 px-4">Dashboard</button>
              <button onClick={logout} className="btn-secondary text-sm py-2 px-4">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
