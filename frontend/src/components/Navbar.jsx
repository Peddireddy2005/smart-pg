import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    syncUser();

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
    };
  }, [location.pathname]);

  // Hide navbar inside dashboard layouts
  if (
    location.pathname.startsWith("/owner") ||
    location.pathname.startsWith("/resident")
  ) {
    return null;
  }

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const openDashboard = () => {
    console.log("Current User:", user);

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "owner") {
      navigate("/owner/dashboard");
    } else {
      navigate("/resident/dashboard");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
            S
          </div>

          <span className="font-heading text-2xl font-bold text-slate-900">
            Smart PG
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link
            to="/pgs"
            className="text-slate-600 hover:text-brand-500 font-medium"
          >
            Browse PGs
          </Link>

          {!user ? (
            <>
              <Link
                to="/login"
                className="text-slate-600 hover:text-brand-500 font-medium"
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
              <button
                onClick={openDashboard}
                className="btn-primary"
              >
                Dashboard
              </button>

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