import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSession, saveSession } from "../../services/authService";
import ImageUploader from "../../components/ImageUploader";

// Fields the backend already requires before a resident can join a room
// (see backend/controllers/inviteController.js claimInvite). Marked with a
// red asterisk here so residents know to fill them in ahead of time,
// instead of discovering it only when the join attempt fails.
const REQUIRED_FIELDS = ["phone", "emergencyContact", "emergencyPhone", "idProofType", "idProofNumber", "idProofUrl"];

function RequiredLabel({ children, field }) {
  const isRequired = REQUIRED_FIELDS.includes(field);
  return (
    <label className="label">
      {children} {isRequired && <span className="text-red-500">*</span>}
    </label>
  );
}

export default function MyProfile() {
  const [form, setForm] = useState({
    name: "", phone: "", emergencyContact: "", emergencyPhone: "",
    address: "", occupation: "", college: "", company: "",
    idProofType: "", idProofNumber: "", photoUrl: "", idProofUrl: "",
    rentalAgreementUrl: "", policeVerificationUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => {
      setForm({
        name: data.name || "", phone: data.phone || "",
        emergencyContact: data.emergencyContact || "", emergencyPhone: data.emergencyPhone || "",
        address: data.address || "", occupation: data.occupation || "", college: data.college || "", company: data.company || "",
        idProofType: data.idProofType || "", idProofNumber: data.idProofNumber || "",
        photoUrl: data.photoUrl || "", idProofUrl: data.idProofUrl || "",
        rentalAgreementUrl: data.rentalAgreementUrl || "", policeVerificationUrl: data.policeVerificationUrl || "",
      });
      setLoading(false);
    });
  }, []);

  const missingRequired = REQUIRED_FIELDS.filter((f) => !form[f]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      const stored = getSession();
      saveSession({ ...stored, name: data.name, photoUrl: data.photoUrl });
      toast.success("Profile updated successfully!");
      if (missingRequired.length > 0) {
        toast("Fill in the fields marked * before you can join a PG", { icon: "⚠️" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwords don't match"); return; }
    setSavingPw(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
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
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-2">My Profile</h1>
      {missingRequired.length > 0 && (
        <p className="text-amber-600 text-sm mb-4">
          Fields marked <span className="text-red-500 font-semibold">*</span> are required before you can join a PG.
        </p>
      )}

      <form onSubmit={save} className="space-y-5">
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-white mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            {form.photoUrl
              ? <img src={form.photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 dark:border-slate-700" />
              : <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-3xl font-bold">{form.name?.charAt(0)}</div>}
            <ImageUploader value={null} onChange={(url) => setForm({ ...form, photoUrl: url })} purpose="profile" label="Upload Photo (JPG, PNG · Max 5MB)" round />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Personal Information</h2>
          <div>
            <RequiredLabel field="name">Full Name</RequiredLabel>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <RequiredLabel field="phone">Phone</RequiredLabel>
              <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <RequiredLabel field="address">Home Address</RequiredLabel>
              <input className="input" placeholder="Hometown address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <RequiredLabel field="emergencyContact">Emergency Contact</RequiredLabel>
              <input className="input" placeholder="Parent/Guardian name" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div>
              <RequiredLabel field="emergencyPhone">Emergency Phone</RequiredLabel>
              <input className="input" placeholder="+91 99999 99999" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Occupation</label><input className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
            <div><label className="label">College</label><input className="input" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-slate-800 dark:text-white">ID Verification</h2>
            <span className={form.idProofType && form.idProofUrl ? "badge-green" : "badge-yellow"}>
              {form.idProofType && form.idProofUrl ? "✓ Complete" : "Incomplete"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <RequiredLabel field="idProofType">ID Type</RequiredLabel>
              <select className="input" value={form.idProofType} onChange={(e) => setForm({ ...form, idProofType: e.target.value })}>
                <option value="">Select ID type</option>
                {["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <RequiredLabel field="idProofNumber">ID Number</RequiredLabel>
              <input className="input" placeholder="e.g. XXXX XXXX XXXX" value={form.idProofNumber} onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <RequiredLabel field="idProofUrl">Upload ID Document</RequiredLabel>
            {form.idProofUrl ? (
              <div className="flex items-center gap-3 mt-1">
                <img src={form.idProofUrl} alt="ID" className="w-24 h-16 object-cover rounded-xl border border-gray-200 dark:border-slate-700" />
                <ImageUploader value={null} onChange={(url) => setForm({ ...form, idProofUrl: url })} purpose="id-proof" label="Change ID Document" />
              </div>
            ) : <ImageUploader value={null} onChange={(url) => setForm({ ...form, idProofUrl: url })} purpose="id-proof" label="Click to upload ID document (JPG/PNG · Max 5MB)" className="mt-1" />}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Documents</h2>
          <div>
            <label className="label">Rental Agreement</label>
            {form.rentalAgreementUrl ? (
              <div className="flex items-center gap-3">
                <a href={form.rentalAgreementUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm hover:underline">View current ↗</a>
                <ImageUploader value={null} onChange={(url) => setForm({ ...form, rentalAgreementUrl: url })} purpose="documents" label="Replace" />
              </div>
            ) : <ImageUploader value={null} onChange={(url) => setForm({ ...form, rentalAgreementUrl: url })} purpose="documents" label="Upload rental agreement" />}
          </div>
          <div>
            <label className="label">Police Verification</label>
            {form.policeVerificationUrl ? (
              <div className="flex items-center gap-3">
                <a href={form.policeVerificationUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm hover:underline">View current ↗</a>
                <ImageUploader value={null} onChange={(url) => setForm({ ...form, policeVerificationUrl: url })} purpose="documents" label="Replace" />
              </div>
            ) : <ImageUploader value={null} onChange={(url) => setForm({ ...form, policeVerificationUrl: url })} purpose="documents" label="Upload police verification" />}
          </div>
        </div>

        <button disabled={saving} className="btn-primary w-full justify-center">{saving ? "Saving..." : "Save Profile"}</button>
      </form>

      <div className="card p-5 mt-5">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={savePassword} className="space-y-3">
          <div><label className="label">Current Password</label><input type="password" className="input" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">New Password</label><input type="password" className="input" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
            <div><label className="label">Confirm New</label><input type="password" className="input" required minLength={6} value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
          </div>
          <button disabled={savingPw} className="btn-secondary text-sm">{savingPw ? "Saving..." : "Change Password"}</button>
        </form>
      </div>
    </div>
  );
}