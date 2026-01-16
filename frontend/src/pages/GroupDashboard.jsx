import { useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

function urgencyClass(u) {
  const v = String(u || "").toLowerCase();
  if (v === "high") return "badge danger";
  if (v === "medium") return "badge warn";
  if (v === "low") return "badge ok";
  return "badge";
}

export default function GroupDashboard() {
  const { user, accessToken } = useAuth();

  // ZIP verification
  const [zipPlaces, setZipPlaces] = useState([]);
  const [zipStatus, setZipStatus] = useState("");

  // Filters
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("");

  // Data
  const [needs, setNeeds] = useState([]);
  const [offers, setOffers] = useState([]);
  const [msg, setMsg] = useState("");

  async function verifyZipAndLoadPlaces(zipValue) {
    const z = (zipValue || "").trim();

    setZipStatus("");
    setZipPlaces([]);
    setCity("");

    if (z.length !== 5) return;

    try {
      setZipStatus("Checking ZIP...");

      // ✅ public ZIP verification API
      const res = await fetch(`https://api.zippopotam.us/us/${z}`);
      if (!res.ok) throw new Error("ZIP not found");

      const data = await res.json();

      const places = (data.places || []).map((p) => ({
        city: p["place name"],
        state: p["state abbreviation"],
      }));

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

  async function load() {
    setMsg("");
    setNeeds([]);
    setOffers([]);

    if (!user || !accessToken) {
      setMsg("❌ Please log in first.");
      return;
    }

    if (!zip || zip.length !== 5 || !city) {
      setMsg("❌ Enter a valid ZIP and select a verified city.");
      return;
    }

    try {
      const needFilters = {
        city,
        ...(category ? { category } : {}),
        ...(urgency ? { urgency } : {}),
      };

      const offerFilters = {
        city,
        ...(category ? { category } : {}),
      };

      const [needData, offerData] = await Promise.all([
        api.listNeeds(needFilters, accessToken),
        api.listOffers(offerFilters, accessToken),
      ]);

      setNeeds(Array.isArray(needData) ? needData : []);
      setOffers(Array.isArray(offerData) ? offerData : []);

      setMsg("✅ Loaded needs and offers for your area.");
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

      {/* Filters */}
      <div className="card">
        <div className="form">
          <label>
            Zip Code (verified)
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
              placeholder="e.g., 60616"
            />
            {zipStatus && (
              <p className="muted" style={{ marginTop: 6 }}>
                {zipStatus}
              </p>
            )}
          </label>

          <label>
            City (verified)
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

          <label>
            Category (optional)
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="housing">Housing</option>
              <option value="medicine">Medicine</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Urgency (Needs only, optional)
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <button className="btn primary" onClick={load} disabled={!user}>
            Load Needs + Offers
          </button>

          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>

      {/* NEEDS */}
      <div className="card">
        <div className="row space" style={{ marginBottom: 8 }}>
          <h3 className="h3" style={{ margin: 0 }}>Needs in {city || "your area"}</h3>
          {/* Later: add counts */}
        </div>

        {!needs.length ? (
          <p className="muted">No needs found for the selected filters.</p>
        ) : (
          <div className="list">
            {needs.map((n) => (
              <div key={n.id} className="item-card">
                {/* Compact header row */}
                <div className="row space" style={{ alignItems: "flex-start" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className={urgencyClass(n.urgency)}>
                      {(n.urgency || "—").toString().toUpperCase()}
                    </span>
                    <div style={{ fontWeight: 800 }}>
                      {n.category ? n.category.toUpperCase() : "NEED"}
                    </div>
                  </div>

                  <div className="muted" style={{ fontSize: 13 }}>
                    {n.city ?? "—"} ({n.zip_code ?? "—"})
                  </div>
                </div>

                <div className="item-desc">
                  {n.description ?? "—"}
                </div>

                {/* Later: "Posted X minutes ago" */}
                {/* <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Posted ...</div> */}

                {/* <div className="item-actions">
                  <button
                    className="btn success"
                    disabled
                    title="Enable when multiple users are testing"
                  >
                    Chat / Coordinate
                  </button>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OFFERS */}
      <div className="card">
        <div className="row space" style={{ marginBottom: 8 }}>
          <h3 className="h3" style={{ margin: 0 }}>Offers in {city || "your area"}</h3>
          {/* Later: add counts */}
        </div>

        {!offers.length ? (
          <p className="muted">No offers found for the selected filters.</p>
        ) : (
          <div className="list">
            {offers.map((o) => (
              <div key={o.id} className="item-card">
                {/* Compact header row */}
                <div className="row space" style={{ alignItems: "flex-start" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="badge">OFFER</span>
                    <div style={{ fontWeight: 800 }}>
                      {o.category ? o.category.toUpperCase() : "—"}
                    </div>
                    {o.quantity !== undefined && o.quantity !== null && (
                      <span className="pill-small">Qty: {o.quantity}</span>
                    )}
                  </div>

                  <div className="muted" style={{ fontSize: 13 }}>
                    {o.city ?? "—"} ({o.zip_code ?? "—"})
                  </div>
                </div>

                <div className="item-desc">
                  {o.description ?? "—"}
                </div>

                {/* Later: "Posted X minutes ago" */}
                {/* <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Posted ...</div> */}

                {/* <div className="item-actions">
                  <button
                    className="btn success"
                    disabled
                    title="Enable when multiple users are testing"
                  >
                    Chat / Coordinate
                  </button>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
