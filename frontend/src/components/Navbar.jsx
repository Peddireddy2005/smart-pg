import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="p-4 flex gap-4 border-b">
      <Link to="/">Home</Link>

      {!token ? (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </>
      ) : (
        <>
          <Link to="/owner/dashboard">
            Dashboard
          </Link>

          <button onClick={logout}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

export default Navbar;