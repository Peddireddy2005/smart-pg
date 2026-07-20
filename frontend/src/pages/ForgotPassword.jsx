import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">S</div>
            <span className="font-heading font-bold text-2xl text-slate-900 dark:text-white">Smart PG</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Forgot Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">We'll email you a link to reset it</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-4xl mb-3">📬</p>
              <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">Check your inbox</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                If an account exists for <strong>{email}</strong>, a reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input type="email" required className="input" placeholder="you@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-5 text-slate-500 dark:text-slate-400">
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
