import { Link } from "react-router-dom";
import SafetyBanner from "../components/SafetyBanner";

export default function Home() {
  const handle = localStorage.getItem("anonymous_handle");

  return (
    <div>
      <SafetyBanner />

      <h1 className="h1">La Tiendita AidMatch</h1>
      <p className="muted">
        Anonymous mutual-aid matching for needs and offers. No personal info required.
      </p>

      {!handle && (
        <div className="card">
          <p><b>You are not signed in.</b></p>
          <Link to="/signup" className="btn outline">Create anonymous profile</Link>
        </div>
      )}

      {handle && (
        <div className="card">
          <p>Logged in as: <b>{handle}</b></p>
          <p className="muted">Post a need or offer, then view matches.</p>
        </div>
      )}

      <div className="grid">
        <Link to="/need" className="btn primary big">I need help</Link>
        <Link to="/offer" className="btn success big">I can offer help</Link>
        <Link to="/group" className="btn dark big">I'm a mutual aid group</Link>
      </div>
    </div>
  );
}
