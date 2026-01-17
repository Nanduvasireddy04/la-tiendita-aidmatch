import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../auth/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        navigate("/", { replace: true });
        return;
      }

      const { error } =
        await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) console.error("OAuth callback error:", error);

      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return <div style={{ padding: 16 }}>Signing you in…</div>;
}
