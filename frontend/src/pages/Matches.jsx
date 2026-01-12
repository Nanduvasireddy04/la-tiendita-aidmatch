import { useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Matches() {
  const { user, accessToken } = useAuth();

  const [needId, setNeedId] = useState(localStorage.getItem("last_need_id") || "");
  const [msg, setMsg] = useState("");
  const [matches, setMatches] = useState([]);

  async function findMatches() {
    setMsg("");
    setMatches([]);

    // ✅ BLOCK if not logged in
    if (!user || !accessToken) {
      setMsg("❌ Please log in first.");
      return;
    }

    if (!needId) {
      setMsg("❌ Please enter a Need ID.");
      return;
    }

    try {
      const data = await api.match(needId, accessToken);
      setMatches(data.matches || data || []);
      setMsg("✅ Matches loaded.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">My Matches</h2>

      {!user && (
        <p className="warn">
          Please log in first. You must be logged in to view matches.
        </p>
      )}

      <div className="card">
        <div className="form">
          <label>
            Need ID
            <input value={needId} onChange={(e) => setNeedId(e.target.value)} />
          </label>

          <button className="btn primary" onClick={findMatches} disabled={!user}>
            Get Matches
          </button>

          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>

      {matches.length > 0 && (
        <div className="card">
          {matches.map((m, idx) => (
            <div key={idx} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <div><b>Need ID:</b> {m.need_id ?? m.needId}</div>
              <div><b>Offer ID:</b> {m.offer_id ?? m.offerId}</div>
              <div><b>Match score:</b> {m.score ?? m.match_score ?? m.matchScore}</div>
              <p className="muted" style={{ marginTop: 6 }}>
                When you coordinate this exchange, please use a local library or other public safe space.
                Do not share personal home addresses.
              </p>

              {/* Chat button will come after backend + supabase chat tables */}
              {/* <button className="btn outline">Open Chat</button> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
