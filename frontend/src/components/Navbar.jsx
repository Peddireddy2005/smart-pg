import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };

    syncUser();

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
    };
  }, [location.pathname]);

  const dashboardPage =
    location.pathname.startsWith("/owner") ||
    location.pathname.startsWith("/resident");

  if (dashboardPage) {
    return null;
  }

  const logout = () => {
    localStorage.removeItem("user");

    window.dispatchEvent(
      new Event("storage")
    );

    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
            S
          </div>

          <span className="font-heading text-2xl font-bold text-slate-900">
            Smart PG
          </span>
        </Link>

        <div className="flex items-center gap-6">

          <Link
            to="/pgs"
            className="font-medium text-slate-600 hover:text-brand-500 transition"
          >
            Browse PGs
          </Link>

          {!user ? (
            <>
              <Link
                to="/login"
                className="font-medium text-slate-600 hover:text-brand-500 transition"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="btn-primary"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                to={
                  user.role === "owner"
                    ? "/owner/dashboard"
                    : "/resident/dashboard"
                }
                className="btn-primary"
              >
                Dashboard
              </Link>

              <button
                onClick={logout}
                className="btn-secondary"
              >
                Logout
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}