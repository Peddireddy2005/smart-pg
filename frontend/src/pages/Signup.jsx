import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "resident" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      window.dispatchEvent(
        new Event("storage")
      );
      navigate(data.role === "owner" ? "/owner/dashboard" : "/resident/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">S</div>
            <span className="font-heading font-bold text-2xl text-slate-900">Smart PG</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Smart PG for free</p>
        </div>

        <div className="card p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Ravi Kumar" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@email.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" required minLength={6}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {["resident", "owner"].map((r) => (
                  <button key={r} type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${form.role === r ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-slate-500 hover:border-gray-300"}`}>
                    {r === "resident" ? "🏠 Resident" : "🔑 Owner"}
                  </button>
                ))}
              </div>
            </div>
            <button disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-5 text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}