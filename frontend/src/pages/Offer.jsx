import { useState } from "react";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Offer() {
  const { user, accessToken } = useAuth();

  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
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
      const data = await api.createOffer(
        {
          category,
          description,
          quantity,
          city,
          zip_code: zip,
        },
        accessToken
      );

      localStorage.setItem("last_offer_id", String(data.id));
      setMsg(`✅ Offer posted (ID ${data.id}).`);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Post Offer</h2>

      {!user && (
        <p className="warn">
          Please log in first. You must be logged in to post an offer.
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
            Quantity
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
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
            Post Offer
          </button>

          {msg && <p className="msg">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
