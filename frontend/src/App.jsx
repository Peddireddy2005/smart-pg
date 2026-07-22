import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Spinner from "./components/Spinner";

// Public pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PGListings = lazy(() => import("./pages/PGListings"));
const PGDetails = lazy(() => import("./pages/PGDetails"));
const JoinInvite = lazy(() => import("./pages/JoinInvite"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Owner pages
const OwnerLayout = lazy(() => import("./layouts/OwnerLayout"));
const OwnerDashboard = lazy(() => import("./pages/owner/OwnerDashboard"));
const OwnerPGDetails = lazy(() => import("./pages/owner/OwnerPGDetails"));
const AddPG = lazy(() => import("./pages/owner/AddPG"));
const EditPG = lazy(() => import("./pages/owner/EditPG"));
const AddRoom = lazy(() => import("./pages/owner/AddRoom"));
const EditRoom = lazy(() => import("./pages/owner/EditRoom"));
const OwnerPayments = lazy(() => import("./pages/owner/OwnerPayments"));
const OwnerComplaints = lazy(() => import("./pages/owner/OwnerComplaints"));
const OwnerAnalytics = lazy(() => import("./pages/owner/OwnerAnalytics"));
const ResidentProfile = lazy(() => import("./pages/owner/ResidentProfile"));
const AllocateResident = lazy(() => import("./pages/owner/AllocateResident"));
const OwnerAnnouncements = lazy(() => import("./pages/owner/Announcements"));
const OwnerStaff = lazy(() => import("./pages/owner/Staff"));
const OwnerVacatedResidents = lazy(() => import("./pages/owner/VacatedResidents"));
const OwnerExpenses = lazy(() => import("./pages/owner/Expenses"));
const OwnerReports = lazy(() => import("./pages/owner/Reports"));
const OwnerActivityLogs = lazy(() => import("./pages/owner/ActivityLogs"));
const OwnerSettings = lazy(() => import("./pages/owner/Settings"));

// Resident pages
const ResidentLayout = lazy(() => import("./layouts/ResidentLayout"));
const ResidentDashboard = lazy(() => import("./pages/resident/ResidentDashboard"));
const ResidentRoom = lazy(() => import("./pages/resident/ResidentRoom"));
const JoinPG = lazy(() => import("./pages/resident/JoinPG"));
const ResidentPayments = lazy(() => import("./pages/resident/ResidentPayments"));
const ResidentComplaints = lazy(() => import("./pages/resident/ResidentComplaints"));
const MyProfile = lazy(() => import("./pages/resident/MyProfile"));
const ResidentAnnouncements = lazy(() => import("./pages/resident/Announcements"));

// Admin pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOwners = lazy(() => import("./pages/admin/AdminOwners"));
const AdminPGs = lazy(() => import("./pages/admin/AdminPGs"));

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

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SessionGuard />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Navbar />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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

            {/* Admin */}
            <Route path="/admin" element={<Guard role="admin"><AdminLayout /></Guard>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="owners" element={<AdminOwners />} />
              <Route path="pgs" element={<AdminPGs />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}