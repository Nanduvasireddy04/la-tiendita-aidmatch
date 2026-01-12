import { useEffect, useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Matches() {
  const { user, accessToken } = useAuth();

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

    // ✅ AUTO: use stored need id (no user input)
    const needId = localStorage.getItem("last_need_id");
    if (!needId) {
      setMsg("❌ Please post a Need first, then come back to Matches.");
      return;
    }

    try {
      const data = await api.match(needId, accessToken);
      const list = data.matches || data || [];
      setMatches(list);
      setMsg(list.length ? "✅ Matches loaded . . ." : "⚠️ No matches yet. Try posting an Offer.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  // ✅ Auto-load when user opens Matches page
  useEffect(() => {
    if (user && accessToken) findMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

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
          <button className="btn primary" onClick={findMatches} disabled={!user}>
            Refresh Matches
          </button>

          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>

      {matches.length > 0 && (
        <div className="card">
          {matches.map((m, idx) => (
            <div key={idx} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
              <div><b>Match score:</b> {m.match_score ?? m.score ?? m.matchScore}</div>

              <div style={{ marginTop: 6 }}><b>Category:</b> {m.offer_category ?? m.category ?? "—"}</div>
              <div><b>Quantity:</b> {m.offer_quantity ?? m.quantity ?? "—"}</div>
              <div><b>City:</b> {m.offer_city ?? m.city ?? "—"}</div>
              <div><b>Zip code:</b> {m.offer_zip_code ?? m.zip_code ?? "—"}</div>

              <div className="muted" style={{ marginTop: 6 }}>
                <b>Description:</b> {m.offer_description ?? m.description ?? "—"}
              </div>

              <p className="muted" style={{ marginTop: 8 }}>
                When you coordinate this exchange, please use a local library or other public safe space.
                Do not share personal home addresses.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
