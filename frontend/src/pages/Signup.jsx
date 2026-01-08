import { useState } from "react";
import { api } from "../api/client";
import SafetyBanner from "../components/SafetyBanner";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const nav = useNavigate();
  const [city, setCity] = useState("Boston");
  const [zip, setZip] = useState("02118");
  const [role, setRole] = useState("individual");
  const [safe, setSafe] = useState("library");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await api.signup({
        city,
        zip_code: zip,
        role,
        preferred_safe_locations: safe,
      });

      localStorage.setItem("anonymous_handle", data.anonymous_handle);

      // Optional: validate login
      await api.login(data.anonymous_handle);

      nav("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Anonymous Profile</h2>

      <form onSubmit={submit} className="card form">
        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </label>

        <label>
          ZIP code
          <input value={zip} onChange={(e) => setZip(e.target.value)} />
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="individual">individual</option>
            <option value="group">group</option>
          </select>
        </label>

        <label>
          Preferred safe meet-up type
          <select value={safe} onChange={(e) => setSafe(e.target.value)}>
            <option value="library">library</option>
            <option value="community center">community center</option>
            <option value="public place">public place</option>
          </select>
        </label>

        <button className="btn primary" disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Profile"}
        </button>

        {err && <div className="error">{err}</div>}
      </form>
    </div>
  );
}
