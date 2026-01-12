import { useEffect, useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { supabase } from "../auth/supabaseClient";
import { useAuth } from "../auth/authprovider.jsx";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) nav("/");
  }, [user, nav]);

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setMsg(error.message);
  }

  async function emailAuth(e) {
    e.preventDefault();
    setMsg("");

    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error) return;

    const signUp = await supabase.auth.signUp({ email, password });
    if (signUp.error) setMsg(signUp.error.message);
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Login / Signup</h2>

      <div className="card">
        {/* Email / Password */}
        <form onSubmit={emailAuth} className="form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn primary" type="submit">
            Continue
          </button>

          {msg && <p className="warn">{msg}</p>}
        </form>

        {/* OAuth buttons at BOTTOM */}
        <div style={{ marginTop: 20 }}>
          <p className="muted">Or continue with</p>

          <div className="stack">
            <button className="btn outline" onClick={signInWithGoogle}>
              <span>🔵</span> Google
            </button>

            <button className="btn outline" disabled title="Facebook coming soon">
              <span>🔵</span> Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
