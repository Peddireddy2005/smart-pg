import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";
import api from "../../services/api";
import { getPaymentSettings, updatePaymentSettings } from "../../services/paymentService";
import { getSession, saveSession } from "../../services/authService";
import ImageUploader from "../../components/ImageUploader";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/auth/me"), getPaymentSettings()])
      .then(([p, pay]) => {
        setProfile({
          businessName: p.data.businessName || "", logoUrl: p.data.logoUrl || "",
          phone: p.data.phone || "", bankDetails: p.data.bankDetails || "", gstNumber: p.data.gstNumber || "",
        });
        setPayment(pay);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", profile);
      const stored = getSession();
      saveSession({ ...stored, businessName: data.businessName, logoUrl: data.logoUrl });
      toast.success("Business profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      await updatePaymentSettings({
        upiId: payment.upiId,
        razorpay: payment.paymentMethodsEnabled.razorpay,
        upi: payment.paymentMethodsEnabled.upi,
        cash: payment.paymentMethodsEnabled.cash,
      });
      const fresh = await getPaymentSettings();
      setPayment(fresh);
      toast.success("Payment settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading || !profile || !payment) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Settings</h1>

      <form onSubmit={saveProfile} className="card p-6 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800">Business Profile</h2>
        <div className="flex items-center gap-4">
          {profile.logoUrl ? <img src={profile.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100" /> : <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><Building2 size={24} /></div>}
          <ImageUploader value={null} onChange={(url) => setProfile({ ...profile, logoUrl: url })} purpose="logo" label="Upload Logo" />
        </div>
        <div>
          <label className="label">Business Name</label>
          <input className="input" value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} placeholder="e.g. Sai PG Ventures" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Bank Details</label>
          <textarea className="input" rows={2} value={profile.bankDetails} onChange={(e) => setProfile({ ...profile, bankDetails: e.target.value })} placeholder="Account number, IFSC, bank name..." />
        </div>
        <div>
          <label className="label">GST Number</label>
          <input className="input" value={profile.gstNumber} onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })} />
        </div>
        <button disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Profile"}</button>
      </form>

      <form onSubmit={savePayment} className="card p-6 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800">Payment Methods</h2>
        <p className="text-sm text-slate-500">Choose which methods residents can use to pay rent.</p>
        {[
          ["razorpay", "Smart PG (Razorpay)"],
          ["upi", "Direct UPI"],
          ["cash", "Cash"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" checked={payment.paymentMethodsEnabled[key]}
              onChange={(e) => setPayment({ ...payment, paymentMethodsEnabled: { ...payment.paymentMethodsEnabled, [key]: e.target.checked } })} />
            {label}
          </label>
        ))}

        {payment.paymentMethodsEnabled.upi && (
          <div>
            <label className="label">UPI ID</label>
            <input className="input" placeholder="owner@ybl" value={payment.upiId || ""} onChange={(e) => setPayment({ ...payment, upiId: e.target.value })} />
            {payment.qrDataUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img src={payment.qrDataUrl} alt="UPI QR" className="w-24 h-24 rounded-xl border border-gray-100" />
                <p className="text-xs text-slate-400">Auto-generated QR from your UPI ID — shown to residents choosing Direct UPI.</p>
              </div>
            )}
          </div>
        )}

        <button disabled={savingPayment} className="btn-primary">{savingPayment ? "Saving..." : "Save Payment Settings"}</button>
      </form>
    </div>
  );
}