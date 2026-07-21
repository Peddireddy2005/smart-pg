import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PGListings from "./pages/PGListings";
import PGDetails from "./pages/PGDetails";
import JoinInvite from "./pages/JoinInvite";
import NotFound from "./pages/NotFound";

// Owner pages
import OwnerLayout from "./layouts/OwnerLayout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerPGDetails from "./pages/owner/OwnerPGDetails";
import AddPG from "./pages/owner/AddPG";
import EditPG from "./pages/owner/EditPG";
import AddRoom from "./pages/owner/AddRoom";
import EditRoom from "./pages/owner/EditRoom";
import OwnerPayments from "./pages/owner/OwnerPayments";
import OwnerComplaints from "./pages/owner/OwnerComplaints";
import OwnerAnalytics from "./pages/owner/OwnerAnalytics";
import ResidentProfile from "./pages/owner/ResidentProfile";
import AllocateResident from "./pages/owner/AllocateResident";
import OwnerAnnouncements from "./pages/owner/Announcements";
import OwnerStaff from "./pages/owner/Staff";
import OwnerVacatedResidents from "./pages/owner/VacatedResidents";
import OwnerExpenses from "./pages/owner/Expenses";
import OwnerReports from "./pages/owner/Reports";
import OwnerActivityLogs from "./pages/owner/ActivityLogs";
import OwnerSettings from "./pages/owner/Settings";

// Resident pages
import ResidentLayout from "./layouts/ResidentLayout";
import ResidentDashboard from "./pages/resident/ResidentDashboard";
import ResidentRoom from "./pages/resident/ResidentRoom";
import JoinPG from "./pages/resident/JoinPG";
import ResidentPayments from "./pages/resident/ResidentPayments";
import ResidentComplaints from "./pages/resident/ResidentComplaints";
import MyProfile from "./pages/resident/MyProfile";
import ResidentAnnouncements from "./pages/resident/Announcements";

// Admin pages (spec §27 — Future / minimal)
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOwners from "./pages/admin/AdminOwners";
import AdminPGs from "./pages/admin/AdminPGs";

import { getSession, clearSession } from "./services/authService";
import { setUnauthorizedHandler } from "./services/api";

const Guard = ({ role, children }) => {
  const user = getSession();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

function SessionGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate("/login");
    });
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SessionGuard />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/pgs" element={<PGListings />} />
          <Route path="/pgs/:id" element={<PGDetails />} />
          <Route path="/join/:token" element={<JoinInvite />} />

          {/* Owner */}
          <Route path="/owner" element={<Guard role="owner"><OwnerLayout /></Guard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="analytics" element={<OwnerAnalytics />} />
            <Route path="add-pg" element={<AddPG />} />
            <Route path="pg/:id" element={<OwnerPGDetails />} />
            <Route path="pg/:id/edit" element={<EditPG />} />
            <Route path="pg/:pgId/add-room" element={<AddRoom />} />
            <Route path="pg/:pgId/room/:roomId/edit" element={<EditRoom />} />
            <Route path="pg/:pgId/allocate" element={<AllocateResident />} />
            <Route path="pg-listings" element={<PGListings />} />
            <Route path="pg-listings/:id" element={<PGDetails />} />
            <Route path="payments" element={<OwnerPayments />} />
            <Route path="complaints" element={<OwnerComplaints />} />
            <Route path="announcements" element={<OwnerAnnouncements />} />
            <Route path="staff" element={<OwnerStaff />} />
            <Route path="vacated" element={<OwnerVacatedResidents />} />
            <Route path="expenses" element={<OwnerExpenses />} />
            <Route path="reports" element={<OwnerReports />} />
            <Route path="activity-logs" element={<OwnerActivityLogs />} />
            <Route path="settings" element={<OwnerSettings />} />
            <Route path="resident/:residentId" element={<ResidentProfile />} />
          </Route>

          {/* Resident */}
          <Route path="/resident" element={<Guard role="resident"><ResidentLayout /></Guard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ResidentDashboard />} />
            <Route path="room" element={<ResidentRoom />} />
            <Route path="join" element={<JoinPG />} />
            <Route path="pg-listings" element={<PGListings />} />
            <Route path="pg-listings/:id" element={<PGDetails />} />
            <Route path="payments" element={<ResidentPayments />} />
            <Route path="complaints" element={<ResidentComplaints />} />
            <Route path="announcements" element={<ResidentAnnouncements />} />
            <Route path="profile" element={<MyProfile />} />
          </Route>

          {/* Admin (platform-level, future-facing per spec) */}
          <Route path="/admin" element={<Guard role="admin"><AdminLayout /></Guard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="owners" element={<AdminOwners />} />
            <Route path="pgs" element={<AdminPGs />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}