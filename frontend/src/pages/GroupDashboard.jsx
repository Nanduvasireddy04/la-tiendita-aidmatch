import { useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function GroupDashboard() {
  const { user, accessToken } = useAuth();

  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("");
  const [needs, setNeeds] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    setNeeds([]);

    // ✅ BLOCK if not logged in
    if (!user || !accessToken) {
      setMsg("❌ Please log in first.");
      return;
    }

    try {
      const data = await api.listNeeds(
        { city, zip_code: zip, category: category || undefined },
        accessToken
      );
      setNeeds(data || []);
      setMsg("✅ Loaded needs.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Mutual Aid Group Dashboard</h2>

      {!user && (
        <p className="warn">
          Please log in first. Groups must be logged in to view the dashboard.
        </p>
      )}

      <div className="card">
        <div className="form">
          <label>
            City
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </label>

          <label>
            Zip Code
            <input value={zip} onChange={(e) => setZip(e.target.value)} />
          </label>

          <label>
            Category (optional)
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>

          <button className="btn primary" onClick={load} disabled={!user}>
            Load Needs
          </button>

          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>

      {needs.length > 0 && (
        <div className="card">
          <h3 className="h3">Needs</h3>
          {needs.map((n) => (
            <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <div><b>ID:</b> {n.id}</div>
              <div><b>Category:</b> {n.category}</div>
              <div><b>Urgency:</b> {n.urgency}</div>
              <div><b>City:</b> {n.city}</div>
              <div><b>Zip:</b> {n.zip_code}</div>
              <div className="muted" style={{ marginTop: 6 }}>{n.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
