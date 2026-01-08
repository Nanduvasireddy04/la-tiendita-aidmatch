import { useEffect, useState } from "react";
import { api } from "../api/client";
import SafetyBanner from "../components/SafetyBanner";

export default function GroupDashboard() {
  const [city, setCity] = useState("Boston");
  const [zip, setZip] = useState("02118");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("all");

  const [needs, setNeeds] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.listNeeds({
        city,
        zip_code: zip,
        category: category || undefined,
      });

      // If backend doesn't filter urgency, filter here:
      const filtered = urgency === "all"
        ? data
        : data.filter((n) => String(n.urgency).toLowerCase() === urgency);

      setNeeds(filtered);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // load on first open

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Mutual Aid Group Dashboard</h2>
      <p className="muted">View needs in your area and filter by category/urgency.</p>

      <div className="card form">
        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </label>

        <label>
          ZIP code
          <input value={zip} onChange={(e) => setZip(e.target.value)} />
        </label>

        <label>
          Category (optional)
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="food" />
        </label>

        <label>
          Urgency
          <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="all">all</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>

        <button className="btn dark" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Search Needs"}
        </button>

        {err && <div className="error">{err}</div>}
      </div>

      <div className="stack">
        {needs?.length > 0 ? needs.map((n) => (
          <div className="card" key={n.id}>
            <div className="row space">
              <div><b>Need #{n.id}</b></div>
              <div className="pill-small">{String(n.urgency).toUpperCase()}</div>
            </div>
            <div><b>Category:</b> {n.category}</div>
            <div className="muted">{n.description}</div>
            <div className="muted">{n.city}, {n.zip_code}</div>
          </div>
        )) : (
          <div className="card">
            <p className="muted">No needs found for these filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
