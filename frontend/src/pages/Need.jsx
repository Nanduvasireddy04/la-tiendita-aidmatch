import { useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Need() {
  const { user, accessToken } = useAuth();
  const [zipPlaces, setZipPlaces] = useState([]);
  const [zipStatus, setZipStatus] = useState("");

  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [msg, setMsg] = useState("");


async function verifyZipAndLoadPlaces(zipValue) {
  const z = (zipValue || "").trim();

  setZipStatus("");
  setZipPlaces([]);
  setCity("");

  if (z.length !== 5) return;

  try {
    setZipStatus("Checking ZIP...");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/geo/zip/${z}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "ZIP lookup failed");
    }
    const data = await res.json();

    const places = data.places || [];
    setZipPlaces(places);

    if (places.length === 1) {
      setCity(places[0].city);
      setZipStatus(`✅ Verified: ${places[0].city}, ${places[0].state}`);
    } else if (places.length > 1) {
      setZipStatus("✅ Verified: choose your city from the list");
    } else {
      setZipStatus("❌ ZIP not found");
    }
  } catch (e) {
    setZipStatus(`❌ ${e.message}`);
  }
}


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
      setMsg(`✅ Need posted.`);
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
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
          Zip Code
          <input
            value={zip}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5);
              setZip(v);

              if (v.length === 5) verifyZipAndLoadPlaces(v);
              else {
                setZipPlaces([]);
                setCity("");
                setZipStatus("");
              }
            }}
            placeholder="e.g., 02118"
          />
          {zipStatus && <p className="muted">{zipStatus}</p>}
        </label>

        <label>
          City
          {zipPlaces.length > 1 ? (
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Select city</option>
              {zipPlaces.map((p, idx) => (
                <option key={idx} value={p.city}>
                  {p.city}, {p.state}
                </option>
              ))}
            </select>
          ) : (
            <input value={city} readOnly placeholder="Auto-filled from ZIP" />
          )}
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
