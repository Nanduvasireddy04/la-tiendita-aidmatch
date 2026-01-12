import { useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Need() {
  const { user, accessToken } = useAuth();

  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    // ✅ BLOCK if not logged in
    if (!user || !accessToken) {
      setMsg("❌ Please log in first.");
      return;
    }

    try {
      const data = await api.createNeed(
        {
          category,
          description,
          urgency,
          city,
          zip_code: zip,
        },
        accessToken
      );

      localStorage.setItem("last_need_id", String(data.id));
      setMsg(`✅ Need posted (ID ${data.id}).`);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Post Need</h2>

      {/* ✅ UI warning if logged out */}
      {!user && (
        <p className="warn">
          Please log in first. You must be logged in to post a need.
        </p>
      )}

      <div className="card">
        <form onSubmit={submit} className="form">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="housing">Housing</option>
              <option value="medicine">Medicine</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <label>
            Urgency
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            City
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </label>

          <label>
            Zip Code
            <input value={zip} onChange={(e) => setZip(e.target.value)} />
          </label>

          <button className="btn primary" disabled={!user}>
            Post Need
          </button>

          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
