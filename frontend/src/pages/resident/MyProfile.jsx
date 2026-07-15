import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSession, saveSession } from "../../services/authService";
import ImageUploader from "../../components/ImageUploader";

export default function MyProfile() {
  const [form, setForm] = useState({
    name: "", phone: "", emergencyContact: "", emergencyPhone: "",
    address: "", idProofType: "", idProofNumber: "", photoUrl: "", idProofUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

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

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      const stored = getSession();
      saveSession({ ...stored, name: data.name, photoUrl: data.photoUrl });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

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
            <ImageUploader
              value={null}
              onChange={(url) => setForm({ ...form, photoUrl: url })}
              purpose="profile"
              label="Upload Photo (JPG, PNG · Max 5MB)"
              round
            />
          </div>
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
              <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Home Address</label>
              <input className="input" placeholder="Hometown address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Emergency Contact</label>
              <input className="input" placeholder="Parent/Guardian name" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div>
              <label className="label">Emergency Phone</label>
              <input className="input" placeholder="+91 99999 99999" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
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
              <select className="input" value={form.idProofType} onChange={(e) => setForm({ ...form, idProofType: e.target.value })}>
                <option value="">Select ID type</option>
                {["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ID Number</label>
              <input className="input" placeholder="e.g. XXXX XXXX XXXX" value={form.idProofNumber} onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Upload ID Document</label>
            {form.idProofUrl ? (
              <div className="flex items-center gap-3 mt-1">
                <img src={form.idProofUrl} alt="ID" className="w-24 h-16 object-cover rounded-xl border border-gray-200" />
                <ImageUploader
                  value={null}
                  onChange={(url) => setForm({ ...form, idProofUrl: url })}
                  purpose="id-proof"
                  label="Change ID Document"
                />
              </div>
            ) : (
              <ImageUploader
                value={null}
                onChange={(url) => setForm({ ...form, idProofUrl: url })}
                purpose="id-proof"
                label="Click to upload ID document (JPG/PNG · Max 5MB)"
                className="mt-1"
              />
            )}
          </div>
        </div>

        <button disabled={saving} className="btn-primary w-full justify-center">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Change password */}
      <div className="card p-5 mt-5">
        <h2 className="font-heading font-semibold text-slate-800 mb-4">Change Password</h2>
        <form onSubmit={savePassword} className="space-y-3">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            </div>
            <div>
              <label className="label">Confirm New</label>
              <input type="password" className="input" required minLength={6} value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
          </div>
          <button disabled={savingPw} className="btn-secondary text-sm">
            {savingPw ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
