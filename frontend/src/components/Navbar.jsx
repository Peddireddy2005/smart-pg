import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  // Hide navbar on dashboards
  if (
    location.pathname.startsWith("/owner") ||
    location.pathname.startsWith("/resident")
  ) {
    return null;
  }

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">
            S
          </div>

          <span className="font-heading text-2xl font-bold text-slate-900">
            Smart PG
          </span>
        </Link>

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
                className="text-slate-600 hover:text-brand-500"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="btn-primary"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  navigate(
                    user.role === "owner"
                      ? "/owner/dashboard"
                      : "/resident/dashboard"
                  )
                }
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