import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { verifyEmail, resendOtp, saveSession } from "../services/authService";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyEmail(email, code);
      saveSession(data);
      toast.success("Email verified!");
      navigate(data.role === "owner" ? "/owner/dashboard" : "/resident/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setResending(true);
    try {
      await resendOtp(email);
      toast.success("If that account needs verification, a new code has been sent.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">S</div>
            <span className="font-heading font-bold text-2xl text-slate-900 dark:text-white">Smart PG</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Verify your email</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter the code we emailed you</p>
        </div>

        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@email.com" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Verification code</label>
              <input className="input tracking-widest text-center" placeholder="••••••" required maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
          <button type="button" onClick={resend} disabled={resending}
            className="text-xs text-slate-400 hover:text-slate-600 w-full text-center mt-4">
            {resending ? "Sending..." : "Didn't get a code? Resend"}
          </button>
        </div>
        <p className="text-center text-sm mt-5 text-slate-500 dark:text-slate-400">
          Already verified?{" "}
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
