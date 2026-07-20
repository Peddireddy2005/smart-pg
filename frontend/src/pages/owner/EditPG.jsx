import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { uploadPGImages, deletePGImage } from "../../services/uploadService";
import ConfirmModal from "../../components/ConfirmModal";

function F({ label, field, form, setForm, ...props }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} {...props} />
    </div>
  );
}

const AMENITY_TOGGLES = [
  ["hasFood", "🍽️ Food"], ["hasAC", "❄️ AC"], ["hasParking", "🅿️ Parking"],
  ["hasWifi", "📶 WiFi"], ["hasLaundry", "🧺 Laundry"],
];

const COMMON_AMENITIES = [
  "Geyser", "TV", "Fridge", "Power Backup", "CCTV", "Housekeeping",
  "Study Table", "Attached Bathroom", "Balcony", "Cupboard", "RO Water", "Lift",
];

export default function EditPG() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [customAmenity, setCustomAmenity] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    api.get(`/pg/${id}`).then(({ data }) => {
      setForm({
        name: data.name || "", city: data.city || "", locality: data.locality || "",
        address: data.address || "", pincode: data.pincode || "", description: data.description || "",
        amenities: data.amenities || [], contactPhone: data.contactPhone || "",
        rules: data.rules || "", isActive: data.isActive !== false, gender: data.gender || "",
        hasFood: !!data.hasFood, hasAC: !!data.hasAC, hasParking: !!data.hasParking,
        hasWifi: !!data.hasWifi, hasLaundry: !!data.hasLaundry,
      });
      setImages(data.images || []);
    });
  }, [id]);

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
    setLoading(true);
    try {
      await api.put(`/pg/${id}`, form);
      toast.success("PG updated");
      navigate(`/owner/pg/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update PG");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const updated = await uploadPGImages(id, files);
      setImages(updated.images);
      toast.success("Images uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const confirmRemoveImage = async () => {
    try {
      const updated = await deletePGImage(id, removingImage);
      setImages(updated.images);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove image");
    } finally {
      setRemovingImage(null);
    }
  };

  if (!form) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to={`/owner/pg/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← Back</Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Edit PG</h1>
      </div>

      <div className="card p-6 mb-5">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white mb-3">Photos</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {images.map((img) => (
            <div key={img._id} className="relative group">
              <img src={img.url} alt="" className="w-full h-24 object-cover rounded-xl border border-gray-100 dark:border-slate-700" />
              <button type="button" onClick={() => setRemovingImage(img._id)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition">✕</button>
            </div>
          ))}
          {images.length < 8 && (
            <button type="button" disabled={uploading} onClick={() => fileRef.current.click()}
              className="h-24 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-slate-400 hover:border-brand-400 hover:text-brand-500 transition text-sm">
              {uploading ? "Uploading..." : "+ Add Photo"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        <p className="text-slate-400 text-xs">Up to 8 photos, 5MB each.</p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <F label="PG Name *" field="name" form={form} setForm={setForm} required />
        <div className="grid grid-cols-2 gap-4">
          <F label="City *" field="city" form={form} setForm={setForm} required />
          <F label="Locality" field="locality" form={form} setForm={setForm} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <F label="Building / Street / Landmark *" field="address" form={form} setForm={setForm} required />
          </div>
          <F label="PIN Code" field="pincode" form={form} setForm={setForm} />
        </div>

        <F label="Contact Phone" field="contactPhone" form={form} setForm={setForm} />

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
            {AMENITY_TOGGLES.map(([key, label]) => (
              <button key={key} type="button" onClick={() => setForm({ ...form, [key]: !form[key] })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${form[key] ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                {label}
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${form.amenities.includes(a) ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
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
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="label">House Rules</label>
          <textarea className="input" rows={2} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Listed publicly (uncheck to hide from search without deleting)
        </label>

        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <ConfirmModal open={!!removingImage} title="Remove this photo?" description="This action can't be undone."
        confirmLabel="Remove" onCancel={() => setRemovingImage(null)} onConfirm={confirmRemoveImage} />
    </div>
  );
}