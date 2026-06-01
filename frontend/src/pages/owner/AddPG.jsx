import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

function F({ label, field, form, setForm, ...props }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={form[field]}
        onChange={(e) =>
          setForm({ ...form, [field]: e.target.value })
        }
        {...props}
      />
    </div>
  );
}

export default function AddPG() {
  const [form, setForm] = useState({
    name: "",
    city: "",
    locality: "",
    address: "",
    description: "",
    amenities: "",
    contactPhone: "",
    rules: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      await api.post("/pg", payload);

      navigate("/owner/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/owner/dashboard"
          className="text-slate-400 hover:text-slate-600 text-sm"
        >
          ← Back
        </Link>

        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Add New PG
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="card p-6 space-y-4">
        <F
          label="PG Name *"
          field="name"
          form={form}
          setForm={setForm}
          placeholder="e.g. Sai Residency"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <F
            label="City *"
            field="city"
            form={form}
            setForm={setForm}
            placeholder="Bangalore"
            required
          />

          <F
            label="Locality"
            field="locality"
            form={form}
            setForm={setForm}
            placeholder="Whitefield"
          />
        </div>

        <F
          label="Full Address *"
          field="address"
          form={form}
          setForm={setForm}
          placeholder="Street, Area, City"
          required
        />

        <F
          label="Contact Phone"
          field="contactPhone"
          form={form}
          setForm={setForm}
          placeholder="+91 98765 43210"
        />

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Describe your PG..."
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        <F
          label="Amenities (comma separated)"
          field="amenities"
          form={form}
          setForm={setForm}
          placeholder="WiFi, Food, AC, Laundry, Parking"
        />

        <div>
          <label className="label">House Rules</label>
          <textarea
            className="input"
            rows={2}
            placeholder="No smoking, Gate closes at 10pm..."
            value={form.rules}
            onChange={(e) =>
              setForm({
                ...form,
                rules: e.target.value,
              })
            }
          />
        </div>

        <button
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? "Creating..." : "Create PG"}
        </button>
      </form>
    </div>
  );
}