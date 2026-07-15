import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function ResidentProfile() {
  const { residentId } = useParams();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/rooms/resident/${residentId}/profile`)
      .then(({ data }) => setResident(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [residentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-red-500">
        <p>{error}</p>
        <Link to="/owner/dashboard" className="text-brand-500 text-sm mt-3 inline-block hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  if (!resident) return null;

  const fields = [
    { label: "Email", value: resident.email },
    { label: "Phone", value: resident.phone || "—" },
    { label: "Emergency Contact", value: resident.emergencyContact || "—" },
    { label: "Emergency Phone", value: resident.emergencyPhone || "—" },
    { label: "Home Address", value: resident.address || "—" },
    { label: "Assigned PG", value: resident.assignedPG?.name || "—" },
    { label: "Room", value: resident.assignedRoom?.roomNumber ? `Room ${resident.assignedRoom.roomNumber}` : "—" },
    { label: "Member Since", value: new Date(resident.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="max-w-2xl">
      <Link to="/owner/dashboard" className="text-slate-400 hover:text-slate-600 text-sm block mb-6">← Back</Link>

      {/* Header card */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-5">
          {resident.photoUrl ? (
            <img src={resident.photoUrl} alt={resident.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-bold shrink-0">
              {resident.name?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-heading text-2xl font-bold text-slate-900">{resident.name}</h1>
              {resident.isVerified
                ? <span className="badge-green">✓ Verified</span>
                : <span className="badge-yellow">Guest</span>}
              {resident.authProvider === "google" && (
                <span className="badge-blue">Google Account</span>
              )}
            </div>
            <p className="text-slate-500">{resident.email}</p>
            {resident.phone && <p className="text-slate-500 text-sm mt-0.5">📞 {resident.phone}</p>}
          </div>
        </div>
      </div>

      {/* Personal details */}
      <div className="card p-6 mb-5">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Personal Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="label">{label}</p>
              <p className="text-slate-700 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ID Proof */}
      <div className="card p-6 mb-5">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">ID Verification</h2>
        {resident.idProofType ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="badge-blue">{resident.idProofType}</span>
              {resident.idProofNumber && (
                <span className="text-sm text-slate-600 font-mono">{resident.idProofNumber}</span>
              )}
            </div>
            {resident.idProofUrl ? (
              <div>
                <p className="label mb-2">ID Document</p>
                <img src={resident.idProofUrl} alt="ID Proof"
                  className="max-w-xs rounded-xl border border-gray-200 shadow-sm" />
                <a href={resident.idProofUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-brand-500 text-sm mt-2 hover:underline">
                  Open full size ↗
                </a>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No ID document uploaded yet</p>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-700 text-sm">⚠️ Resident has not uploaded ID proof yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
