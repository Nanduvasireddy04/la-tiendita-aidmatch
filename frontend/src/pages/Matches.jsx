import { useEffect, useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";
import { useNavigate } from "react-router-dom";

function scoreBadgeClass(score) {
  const s = Number(score);
  if (Number.isFinite(s)) {
    if (s >= 80) return "badge ok";
    if (s >= 50) return "badge warn";
    return "badge danger";
  }
  return "badge";
}

export default function Matches() {
  const { user, accessToken } = useAuth();

  const [msg, setMsg] = useState("");
  const [matches, setMatches] = useState([]);
  const nav = useNavigate();

  async function openChat(offerId) {
    setMsg("");
    try {
      const needId = localStorage.getItem("last_need_id");
      if (!needId) throw new Error("Post a Need first.");

      const convo = await api.createConversation(
        { need_id: Number(needId), offer_id: Number(offerId) },
        accessToken
      );

      nav(`/chat/${convo.id}`);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function findMatches() {
    setMsg("");
    setMatches([]);

    if (!user || !accessToken) {
      setMsg("❌ Please log in first.");
      return;
    }

    const needId = localStorage.getItem("last_need_id");
    if (!needId) {
      setMsg("❌ Please post a Need first, then come back to Matches.");
      return;
    }

    try {
      const data = await api.match(needId, accessToken);
      const list = data.matches || data || [];
      setMatches(Array.isArray(list) ? list : []);
      setMsg(list.length ? "✅ Matches loaded." : "⚠️ No matches yet. Try posting an Offer.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

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
        <div className="row space">
          <div className="muted">Matches for your most recently posted Need</div>
          <button className="btn primary" onClick={findMatches} disabled={!user}>
            Refresh
          </button>
        </div>
        {msg && <p className="msg" style={{ marginTop: 10 }}>{msg}</p>}
      </div>

      {matches.length > 0 && (
        <div className="card">
          <div className="list">
            {matches.map((m, idx) => {
              const score = m.match_score ?? m.score ?? m.matchScore;
              const category = m.offer_category ?? m.category ?? "—";
              const qty = m.offer_quantity ?? m.quantity ?? "—";
              const city = m.offer_city ?? m.city ?? "—";
              const zip = m.offer_zip_code ?? m.zip_code ?? "—";
              const desc = m.offer_description ?? m.description ?? "—";
              const offerId = m.offer_id ?? m.offerId ?? m.id;

              return (
                <div key={offerId ?? idx} className="item-card">
                  {/* Compact header row */}
                  <div className="row space" style={{ alignItems: "flex-start" }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={scoreBadgeClass(score)}>
                        {Number.isFinite(Number(score)) ? `SCORE ${Number(score)}` : "SCORE —"}
                      </span>
                      <div style={{ fontWeight: 800 }}>
                        {String(category).toUpperCase()}
                      </div>
                      <span className="pill-small">Qty: {qty}</span>
                    </div>

                    <div className="muted" style={{ fontSize: 13 }}>
                      {city} ({zip})
                    </div>
                  </div>

                  <div className="item-desc">
                    {desc}
                  </div>

                  <div className="item-actions">
                    <button
                      className="btn success"
                      onClick={() => openChat(offerId)}
                      disabled={!offerId}
                      title={!offerId ? "Missing offer_id in match response" : ""}
                    >
                      Chat / Coordinate
                    </button>
                  </div>

                  <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                    Safety reminder: Coordinate in a public safe place (library/community center).
                    Do not share home addresses.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
