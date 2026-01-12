

import SafetyBanner from "../components/SafetyBanner";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authprovider.jsx";

export default function Home() {
  const { user } = useAuth();

  // Public “anonymous” display (NOT email)
  const publicLabel = user ? `user_${user.id.slice(0, 6)}` : null;

  return (
    <div>
      <SafetyBanner />

      <h2 className="h2">La Tiendita AidMatch</h2>

      {user ? (
        <p className="msg">
          Logged in as: <b>{publicLabel}</b>
        </p>
      ) : (
        <p className="warn">
          You are logged out. Please <Link to="/signup">log in</Link> to post needs/offers and view matches.
        </p>
      )}

      <p className="muted">
        Post a need or offer, then view matches.
      </p>

      <div className="card">
        <div className="stack">
          <Link className="btn primary" to="/need" style={{ pointerEvents: user ? "auto" : "none", opacity: user ? 1 : 0.6 }}>
            I need help
          </Link>

          <Link className="btn dark" to="/offer" style={{ pointerEvents: user ? "auto" : "none", opacity: user ? 1 : 0.6 }}>
            I can offer help
          </Link>

          <Link className="btn outline" to="/group" style={{ pointerEvents: user ? "auto" : "none", opacity: user ? 1 : 0.6 }}>
            I’m a mutual aid group
          </Link>

          {!user && (
            <p className="muted" style={{ marginTop: 8 }}>
              Log in first to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
