import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OwnerDashboard from "./pages/OwnerDashboard";
import AddPG from "./pages/AddPG";
import OwnerPGDetails from "./pages/OwnerPGDetails";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/add-pg" element={<AddPG />} />
        <Route path="/owner/pg/:pgId" element={<OwnerPGDetails />} />
      </Routes>
    </>
  );
}

export default App;