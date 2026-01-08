import { useEffect, useState } from "react";
import { api } from "../api/client";
import SafetyBanner from "../components/SafetyBanner";
import { Link } from "react-router-dom";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const needId = localStorage.getItem("last_need_id");

  useEffect(() => {
    async function load() {
      setErr("");
      if (!needId) {
        setErr("No need posted yet. Post a need first.");
        setLoading(false);
        return;
      }
      try {
        const data = await api.match(needId);
        setMatches(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [needId]);

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">My Matches</h2>

      <div className="row">
        <Link to="/need" className="btn outline">Post Need</Link>
        <Link to="/offer" className="btn outline">Post Offer</Link>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {err && <div className="error">{err}</div>}

      {!loading && !err && matches?.length === 0 && (
        <div className="card">
          <p><b>No matches yet.</b></p>
          <p className="muted">
            Create an offer with the same city/ZIP/category as your need.
          </p>
        </div>
      )}

      {matches?.length > 0 && (
        <div className="stack">
          {matches.map((m, i) => (
            <div className="card" key={i}>
              <div><b>Need ID:</b> {m.need_id}</div>
              <div><b>Offer ID:</b> {m.offer_id}</div>
              <div><b>Match score:</b> {m.match_score}</div>
              <hr />
              <div className="muted">{m.safety_text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
