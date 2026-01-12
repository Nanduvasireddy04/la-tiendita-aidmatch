// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// export default function AuthCallback() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     (async () => {
//       // Supabase will parse the OAuth redirect and set a session automatically.
//       await supabase.auth.getSession();
//       navigate("/", { replace: true });
//     })();
//   }, [navigate]);

//   return <div style={{ padding: 20 }}>Signing you in…</div>;
// }
