import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getInviteByCode, claimInvite } from "../../services/inviteService";

export default function JoinPG() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [hasIdProof, setHasIdProof] = useState(true);
  const [assignedPG, setAssignedPG] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => {
        setHasIdProof(Boolean(data.idProofType && data.idProofUrl));
        setAssignedPG(data.assignedPG || null);
      })
      .catch(() => {})
      .finally(() => setCheckingProfile(false));
  }, []);

  const lookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLooking(true);
    setError("");
    setInvite(null);
    try {
      const data = await getInviteByCode(code.trim());
      setInvite(data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code");
    } finally {
      setLooking(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await claimInvite(invite.token);
      toast.success("You've joined the room!");
      navigate("/resident/room");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to join";
      toast.error(message);
      if (/ID verification/i.test(message)) setHasIdProof(false);
    } finally {
      setJoining(false);
    }
  };

  if (!checkingProfile && assignedPG) {
    return (
      <div className="max-w-lg">
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">Join a PG</h1>
        <div className="card p-6 text-center">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium">You're already assigned to a PG.</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            To join a different PG, first submit a vacate notice from{" "}
            <Link to="/resident/room" className="text-brand-500 underline">My Room</Link> and wait for your owner to process it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">Join a PG</h1>

      {!checkingProfile && !hasIdProof && (
        <div className="card p-4 mb-5 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40">
          <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">⚠️ Complete your ID verification first</p>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
            Owners require ID proof before you can join a room.{" "}
            <Link to="/resident/profile" className="underline font-medium">Upload it in My Profile</Link>.
          </p>
        </div>
      )}

      {!invite ? (
        <form onSubmit={lookup} className="card p-6 space-y-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ask your PG owner for the invite code they generated for your room. You can also join by
            scanning their QR code, if they shared one.
          </p>
          <div>
            <label className="label">Invite Code</label>
            <input
              className="input tracking-widest text-center font-mono uppercase"
              placeholder="A1B2C3D4"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button disabled={looking} className="btn-primary w-full justify-center">
            {looking ? "Checking..." : "Find Room"}
          </button>
        </form>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-heading font-bold text-xl text-slate-900 dark:text-white">{invite.pg?.name}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{invite.pg?.city}</p>
          <p className="text-slate-600 dark:text-slate-300 mt-3">
            Room <strong>{invite.room?.roomNumber}</strong> · {invite.room?.type || "Standard"} · ₹{invite.room?.rent?.toLocaleString()}/mo
          </p>

          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => { setInvite(null); setCode(""); }} className="btn-secondary">
              ← Try another code
            </button>
            <button disabled={joining || !hasIdProof} onClick={handleJoin} className="btn-primary">
              {joining ? "Joining..." : "Join This Room"}
            </button>
          </div>
          {!hasIdProof && (
            <p className="text-amber-600 text-xs mt-3">Complete ID verification in your profile to enable joining.</p>
          )}
        </div>
      )}
    </div>
  );
}