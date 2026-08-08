import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Utensils, Snowflake, Car, Wifi, Shirt } from "lucide-react";
import api from "../../services/api";

function Field({ label, field, form, setForm, ...props }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} {...props} />
    </div>
  );
}

const AMENITY_TOGGLES = [
  ["hasFood", Utensils, "Food"], ["hasAC", Snowflake, "AC"], ["hasParking", Car, "Parking"],
  ["hasWifi", Wifi, "WiFi"], ["hasLaundry", Shirt, "Laundry"],
];

const COMMON_AMENITIES = [
  "Geyser", "TV", "Fridge", "Power Backup", "CCTV", "Housekeeping",
  "Study Table", "Attached Bathroom", "Balcony", "Cupboard", "RO Water", "Lift",
];

export default function AddPG() {
  const [form, setForm] = useState({
    name: "", city: "", locality: "", address: "", pincode: "",
    description: "", amenities: [], contactPhone: "", rules: "",
    gender: "", hasFood: false, hasAC: false, hasParking: false, hasWifi: false, hasLaundry: false,
  });
  const [customAmenity, setCustomAmenity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const addCustomAmenity = () => {
    const value = customAmenity.trim();
    if (value && !form.amenities.includes(value)) {
      setForm((f) => ({ ...f, amenities: [...f.amenities, value] }));
    }
    setCustomAmenity("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/pg", form);
      toast.success("PG created!");
      navigate(`/owner/pg/${data._id}`);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create PG";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/owner/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Back</Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Add New PG</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

      <form onSubmit={submit} className="card p-6 space-y-4">
        <Field label="PG Name *" field="name" form={form} setForm={setForm} placeholder="e.g. Sai Residency" required />

        <div className="grid grid-cols-2 gap-4">
          <Field label="City *" field="city" form={form} setForm={setForm} placeholder="Bangalore" required />
          <Field label="Locality" field="locality" form={form} setForm={setForm} placeholder="Whitefield" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Building / Street / Landmark *" field="address" form={form} setForm={setForm}
              placeholder="81/1 Sri Krishna Nilaya, Chalukya Layout 1st Cross" required />
          </div>
          <Field label="PIN Code" field="pincode" form={form} setForm={setForm} placeholder="560045" />
        </div>

        <Field label="Contact Phone" field="contactPhone" form={form} setForm={setForm} placeholder="+91 98765 43210" />

        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Co-ed">Co-ed</option>
          </select>
        </div>

        <div>
          <label className="label">Facilities</label>
          <p className="text-xs text-slate-400 -mt-1 mb-2">Used for search filters on the listings page.</p>
          <div className="flex flex-wrap gap-2">
            {AMENITY_TOGGLES.map(([key, Icon, label]) => (
              <button key={key} type="button" onClick={() => setForm({ ...form, [key]: !form[key] })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 ${form[key] ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Additional Amenities</label>
          <p className="text-xs text-slate-400 -mt-1 mb-2">Shown on your listing page for extra detail.</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_AMENITIES.map((a) => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${form.amenities.includes(a) ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                {a}
              </button>
            ))}
            {form.amenities.filter((a) => !COMMON_AMENITIES.includes(a)).map((a) => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white">
                {a} ✕
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Add something else..." value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }} />
            <button type="button" onClick={addCustomAmenity} className="btn-secondary text-sm shrink-0">+ Add</button>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} placeholder="Describe your PG..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="label">House Rules</label>
          <textarea className="input" rows={2} placeholder="No smoking, Gate closes at 10pm..."
            value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
        </div>

        <p className="text-xs text-slate-400">You can add room photos after creating the PG from the PG detail page.</p>

        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Creating..." : "Create PG"}
        </button>
      </form>
    </div>
  );
}