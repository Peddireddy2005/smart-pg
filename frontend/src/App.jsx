import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PGListings from "./pages/PGListings";
import PGDetails from "./pages/PGDetails";
import OwnerLayout from "./layouts/OwnerLayout";
import ResidentLayout from "./layouts/ResidentLayout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerPGDetails from "./pages/owner/OwnerPGDetails";
import AddPG from "./pages/owner/AddPG";
import AddRoom from "./pages/owner/AddRoom";
import OwnerPayments from "./pages/owner/OwnerPayments";
import OwnerComplaints from "./pages/owner/OwnerComplaints";
import ResidentProfile from "./pages/owner/ResidentProfile";
import ResidentDashboard from "./pages/resident/ResidentDashboard";
import ResidentRoom from "./pages/resident/ResidentRoom";
import ResidentPayments from "./pages/resident/ResidentPayments";
import ResidentComplaints from "./pages/resident/ResidentComplaints";
import MyProfile from "./pages/resident/MyProfile";
import AllocateResident from "./pages/owner/AllocateResident";

const Guard = ({ role, children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  console.log("[GUARD] Role required:", role, "| User:", user?.role || "none");
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pgs" element={<PGListings />} />
        <Route path="/pgs/:id" element={<PGDetails />} />

        <Route path="/owner" element={<Guard role="owner"><OwnerLayout /></Guard>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="add-pg" element={<AddPG />} />
          <Route path="pg/:id" element={<OwnerPGDetails />} />
          <Route path="pg/:pgId/add-room" element={<AddRoom />} />
          <Route path="pg/:pgId/allocate" element={<AllocateResident />} />
          <Route path="payments" element={<OwnerPayments />} />
          <Route path="complaints" element={<OwnerComplaints />} />
          <Route path="resident/:residentId" element={<ResidentProfile />} />
        </Route>

        <Route path="/resident" element={<Guard role="resident"><ResidentLayout /></Guard>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ResidentDashboard />} />
          <Route path="room" element={<ResidentRoom />} />
          <Route path="payments" element={<ResidentPayments />} />
          <Route path="complaints" element={<ResidentComplaints />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}