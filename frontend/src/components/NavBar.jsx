import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const nav = useNavigate();
  const handle = localStorage.getItem("anonymous_handle");

  function logout() {
    localStorage.removeItem("anonymous_handle");
    localStorage.removeItem("last_need_id");
    localStorage.removeItem("last_offer_id");
    nav("/");
  }

  return (
    <div className="nav">
      <Link to="/" className="nav-brand">La Tiendita</Link>

      <div className="nav-links">
        <Link to="/need">Need</Link>
        <Link to="/offer">Offer</Link>
        <Link to="/matches">Matches</Link>
        <Link to="/group">Group</Link>
        {!handle ? (
          <Link to="/signup" className="pill">Signup</Link>
        ) : (
          <button className="pill" onClick={logout}>Logout</button>
        )}
      </div>
    </div>
  );
}
