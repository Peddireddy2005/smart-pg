import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { saveSession } from "../services/authService";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", form);

      saveSession(data);

      if (data.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/resident/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">
              S
            </div>

            <span className="font-heading font-bold text-2xl text-slate-900">
              Smart PG
            </span>
          </Link>

          <h1 className="font-heading text-3xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="text-slate-500 mt-2">
            Login to continue
          </p>
        </div>

        <div className="card p-8">

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="mb-5">
            <GoogleAuthButton role="resident" />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-slate-400 text-xs uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form
            onSubmit={submit}
            className="space-y-5"
          >

            <div>
              <label className="label">
                Email
              </label>

              <input
                type="email"
                required
                className="input"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">
                  Password
                </label>
                <Link to="/forgot-password" className="text-brand-500 text-xs font-semibold hover:text-brand-600">
                  Forgot password?
                </Link>
              </div>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  className="input pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password:
                        e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>
        </div>

        <p className="text-center text-sm mt-5 text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-brand-500 font-semibold hover:text-brand-600"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}
