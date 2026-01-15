

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authprovider";

export default function NavBar() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  async function logout() {
    await signOut();
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
        <Link to="/chats">Chat</Link>


        {!user ? (
          <Link to="/signup" className="pill">Login</Link>
        ) : (
          <button className="pill" onClick={logout}>Logout</button>
        )}
      </div>
    </div>
  );
}
