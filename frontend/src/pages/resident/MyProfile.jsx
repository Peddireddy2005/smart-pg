import { useEffect, useState, useRef } from "react";
import api from "../../services/api";

export default function MyProfile() {
  const [form, setForm] = useState({
    name: "", phone: "", emergencyContact: "", emergencyPhone: "",
    address: "", idProofType: "", idProofNumber: "", photoUrl: "", idProofUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const photoRef = useRef();
  const idRef = useRef();

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => {
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: data.emergencyPhone || "",
        address: data.address || "",
        idProofType: data.idProofType || "",
        idProofNumber: data.idProofNumber || "",
        photoUrl: data.photoUrl || "",
        idProofUrl: data.idProofUrl || "",
      });
      setLoading(false);
    });
  }, []);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setMsg({ type: "error", text: "Photo must be under 1MB" }); return; }
    console.log("[PROFILE] Photo selected:", file.name, file.size);
    const base64 = await toBase64(file);
    setForm((f) => ({ ...f, photoUrl: base64 }));
  };

  const handleIdProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg({ type: "error", text: "ID proof must be under 2MB" }); return; }
    console.log("[PROFILE] ID proof selected:", file.name);
    const base64 = await toBase64(file);
    setForm((f) => ({ ...f, idProofUrl: base64 }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    console.log("[PROFILE] Saving profile");
    try {
      const { data } = await api.put("/auth/profile", form);
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem("user", JSON.stringify({ ...stored, name: data.name, photoUrl: data.photoUrl }));
      setMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to save" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 mb-5 ${msg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        {/* Photo */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-slate-800 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-bold">
                {form.name?.charAt(0)}
              </div>
            )}
            <div>
              <button type="button" onClick={() => photoRef.current.click()}
                className="btn-secondary text-sm">Upload Photo</button>
              <p className="text-slate-400 text-xs mt-1">JPG, PNG · Max 1MB</p>
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Personal info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800">Personal Information</h2>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Home Address</label>
              <input className="input" placeholder="Hometown address" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Emergency Contact Name</label>
              <input className="input" placeholder="Parent/Guardian name" value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div>
              <label className="label">Emergency Phone</label>
              <input className="input" placeholder="+91 99999 99999" value={form.emergencyPhone}
                onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* ID Proof */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-slate-800">ID Verification</h2>
            <span className={form.idProofType && form.idProofUrl ? "badge-green" : "badge-yellow"}>
              {form.idProofType && form.idProofUrl ? "✓ Complete" : "Incomplete"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ID Type</label>
              <select className="input" value={form.idProofType}
                onChange={(e) => setForm({ ...form, idProofType: e.target.value })}>
                <option value="">Select ID type</option>
                {["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ID Number</label>
              <input className="input" placeholder="e.g. XXXX XXXX XXXX" value={form.idProofNumber}
                onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Upload ID Document</label>
            <div className="mt-1">
              {form.idProofUrl ? (
                <div className="flex items-center gap-3">
                  <img src={form.idProofUrl} alt="ID" className="w-24 h-16 object-cover rounded-xl border border-gray-200" />
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">✓ Uploaded</p>
                    <button type="button" onClick={() => idRef.current.click()} className="text-brand-500 text-sm hover:underline">Change</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => idRef.current.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 text-slate-500 hover:border-brand-400 hover:text-brand-500 transition w-full text-sm">
                  📎 Click to upload ID document (JPG/PNG · Max 2MB)
                </button>
              )}
            </div>
            <input ref={idRef} type="file" accept="image/*" className="hidden" onChange={handleIdProof} />
          </div>
        </div>

        <button disabled={saving} className="btn-primary w-full justify-center">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}