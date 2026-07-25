import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setResetUrl(data.resetUrl || null);
      // Pull the token out ourselves instead of string-replacing
      // window.location.origin out of the full URL — that replace()
      // silently no-ops (and breaks the in-app link) whenever the
      // resetUrl's origin doesn't match exactly, e.g. a different port.
      setResetToken(data.resetUrl ? data.resetUrl.split("/reset-password/")[1] : null);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetUrl);
    toast.success("Link copied");
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-ink-900 rounded-lg flex items-center justify-center text-paper font-heading font-semibold">S</div>
            <span className="font-heading font-semibold text-2xl text-ink-900 dark:text-white">Smart PG</span>
          </Link>
          <h1 className="font-heading text-3xl font-semibold text-ink-900 dark:text-white">Forgot password</h1>
          <p className="text-ink-400 mt-2">We'll generate a reset link for your account</p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              {resetUrl ? (
                <>
                  <p className="text-ink-900 dark:text-white font-medium mb-3">Your reset link is ready</p>
                  <p className="text-ink-400 text-sm mb-4">
                    This build doesn't send email, so use the link below directly.
                  </p>
                  <div className="bg-paper dark:bg-ink-900 rounded-md p-3 text-xs break-all text-ink-700 dark:text-ink-100 mb-3 border border-[#DAD4C4] dark:border-ink-700">
                    {resetUrl}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyLink} className="btn-secondary text-sm flex-1">Copy Link</button>
                    <Link to={resetToken ? `/reset-password/${resetToken}` : "#"} className="btn-primary text-sm flex-1 justify-center">Open Link</Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-ink-900 dark:text-white font-medium mb-1">No account found</p>
                  <p className="text-ink-400 text-sm">
                    If an account exists for <strong>{email}</strong>, you'd see a reset link here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input type="email" required className="input" placeholder="you@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? "Generating..." : "Generate Reset Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-5 text-ink-400">
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}