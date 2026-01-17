import { useEffect, useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { supabase } from "../auth/supabaseClient";
import { useAuth } from "../auth/authprovider.jsx";
import { useNavigate } from "react-router-dom";
import { supabase as supabaseClient } from "../auth/supabaseClient.js";


export default function Signup() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) nav("/");
  }, [user, nav]);

//   async function signInWithFacebook() {
//     const { error } = await supabaseClient.auth.signInWithOAuth({
//       provider: "facebook",
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`,
//       },
//     });

//   if (error) alert(error.message);
// }


  async function signInWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      // options: { redirectTo: window.location.origin },
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
            <button
              type="button"
              className="btn google-btn"
              onClick={signInWithGoogle}
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                style={{
                  width: "18px",
                  height: "18px",
                  marginRight: "10px",
                }}
              />
              Google
            </button>

            {/* <button className="btn outline" onClick={signInWithFacebook}>
              <span></span> Facebook
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
