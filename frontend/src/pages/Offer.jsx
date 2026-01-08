import { useState } from "react";
import { api } from "../api/client";
import SafetyBanner from "../components/SafetyBanner";
import { Link, useNavigate } from "react-router-dom";

export default function Offer() {
  const nav = useNavigate();
  const handle = localStorage.getItem("anonymous_handle");

  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("Can offer rice, beans, pasta");
  const [quantity, setQuantity] = useState(3);
  const [city, setCity] = useState("Boston");
  const [zip, setZip] = useState("02118");
  const [agree, setAgree] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!handle) {
      setErr("Create an anonymous profile first.");
      return;
    }
    if (!agree) {
      setErr("You must agree to meet only in a safe public location.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.createOffer(handle, {
        category,
        description,
        quantity: Number(quantity),
        city,
        zip_code: zip,
      });
      localStorage.setItem("last_offer_id", String(data.offer_id));
      nav("/matches");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Post an Offer</h2>

      {!handle && (
        <div className="card">
          <p>You need a profile first.</p>
          <Link to="/signup" className="btn outline">Create profile</Link>
        </div>
      )}

      <form onSubmit={submit} className="card form">
        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <label>
          Quantity
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={1} />
        </label>

        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </label>

        <label>
          ZIP code
          <input value={zip} onChange={(e) => setZip(e.target.value)} />
        </label>

        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I agree to meet only in a safe public location (library/community center).
        </label>

        <button className="btn success" disabled={loading} type="submit">
          {loading ? "Posting..." : "Post Offer"}
        </button>

        {err && <div className="error">{err}</div>}
      </form>
    </div>
  );
}
