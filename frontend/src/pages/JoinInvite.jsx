import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getInvite, claimInvite } from "../services/inviteService";
import { getSession } from "../services/authService";

/**
 * Landing page for a scanned QR invite (spec §7 — QR Based Resident
 * Joining). Shows the room/PG being joined; if the visitor isn't logged in
 * yet they're sent to signup/OTP login first, then brought back here to
 * auto-claim the room.
 */
export default function JoinInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const user = getSession();
  const missingIdProof = user && !(user.idProofType && user.idProofUrl);

  useEffect(() => {
    getInvite(token)
      .then(setInvite)
      .catch((err) => setError(err.response?.data?.message || "This invite link is invalid"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimInvite(token);
      toast.success("You've joined the room!");
      navigate("/resident/room");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] dark:bg-slate-900"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">S</div>
            <span className="font-heading font-bold text-2xl text-slate-900 dark:text-white">Smart PG</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Join Your Room</h1>
        </div>

        <div className="card p-8 text-center">
          {error ? (
            <>
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-slate-600 dark:text-slate-300">{error}</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-3">🏠</p>
              <p className="font-heading font-bold text-xl text-slate-900 dark:text-white">{invite.pg?.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{invite.pg?.city}</p>
              <p className="text-slate-600 dark:text-slate-300 mt-4">
                Room <strong>{invite.room?.roomNumber}</strong> · {invite.room?.type || "Standard"} · ₹{invite.room?.rent?.toLocaleString()}/mo
              </p>

              {!user ? (
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign up or log in to join this room instantly.</p>
                  <Link to="/signup" state={{ from: `/join/${token}` }} className="btn-primary w-full justify-center">Create Account</Link>
                  <Link to="/login" state={{ from: `/join/${token}` }} className="btn-secondary w-full justify-center">I already have an account</Link>
                </div>
              ) : user.role !== "resident" ? (
                <p className="text-amber-600 text-sm mt-6">Only resident accounts can join a room. Please log in as a resident.</p>
              ) : missingIdProof ? (
                <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 text-left">
                  <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">⚠️ ID verification required</p>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                    Please upload your ID proof before joining.{" "}
                    <Link to="/resident/profile" className="underline font-medium">Go to My Profile →</Link>
                  </p>
                </div>
              ) : (
                <button disabled={claiming} onClick={handleClaim} className="btn-primary w-full justify-center mt-6">
                  {claiming ? "Joining..." : "Join This Room"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}