import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { googleAuth, saveSession } from "../services/authService";

/**
 * Renders Google's official "Sign in with Google" button. Requires the
 * Google Identity Services script (loaded in index.html) and a configured
 * VITE_GOOGLE_CLIENT_ID. `role` is only used if this results in a brand new
 * account being created (existing accounts keep their original role).
 */
export default function GoogleAuthButton({ role = "resident", text = "continue_with" }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const data = await googleAuth(response.credential, role);
          saveSession(data);
          navigate(data.role === "owner" ? "/owner/dashboard" : "/resident/dashboard");
        } catch (err) {
          toast.error(err.response?.data?.message || "Google sign-in failed");
        }
      },
    });

    if (ref.current) {
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text,
      });
    }
  }, [role, text, navigate]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return <div ref={ref} className="flex justify-center" />;
}
