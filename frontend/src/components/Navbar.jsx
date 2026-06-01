import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    console.log("[NAVBAR] Location changed to:", location.pathname, "| User:", parsed?.email || "none");
    setUser(parsed);
  }, [location]);

  const logout = () => {
    console.log("[NAVBAR] Logout clicked by:", user?.email);
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    console.log("[NAVBAR] User logged out, redirecting to /login");
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <Link to="/" className="text-xl font-bold tracking-tight" onClick={() => console.log("[NAVBAR] Logo clicked")}>Smart PG</Link>
      <div className="flex gap-4 items-center text-sm font-medium">
        <Link to="/pgs" onClick={() => console.log("[NAVBAR] Browse PGs clicked")}>Browse PGs</Link>
        {!user ? (
          <>
            <Link to="/login" onClick={() => console.log("[NAVBAR] Login button clicked")} className="bg-white text-blue-700 px-4 py-1.5 rounded-lg">Login</Link>
            <Link to="/signup" onClick={() => console.log("[NAVBAR] Signup button clicked")} className="border border-white px-4 py-1.5 rounded-lg">Signup</Link>
          </>
        ) : user.role === "owner" ? (
          <>
            <Link to="/owner/dashboard" onClick={() => console.log("[NAVBAR] Owner Dashboard clicked")}>Dashboard</Link>
            <Link to="/owner/payments" onClick={() => console.log("[NAVBAR] Owner Payments clicked")}>Payments</Link>
            <Link to="/owner/complaints" onClick={() => console.log("[NAVBAR] Owner Complaints clicked")}>Complaints</Link>
            <button onClick={logout} className="bg-white text-blue-700 px-4 py-1.5 rounded-lg">Logout</button>
          </>
        ) : (
          <>
            <Link to="/resident/dashboard" onClick={() => console.log("[NAVBAR] Resident Dashboard clicked")}>Dashboard</Link>
            <Link to="/resident/room" onClick={() => console.log("[NAVBAR] My Room clicked")}>My Room</Link>
            <Link to="/resident/payments" onClick={() => console.log("[NAVBAR] Rent clicked")}>Rent</Link>
            <Link to="/resident/complaints" onClick={() => console.log("[NAVBAR] Complaints clicked")}>Complaints</Link>
            <button onClick={logout} className="bg-white text-blue-700 px-4 py-1.5 rounded-lg">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}