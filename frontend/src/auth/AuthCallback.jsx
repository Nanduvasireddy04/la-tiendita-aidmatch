import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../auth/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) console.error("OAuth callback error:", error);
      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return <div style={{ padding: 16 }}>Signing you in…</div>;
}
