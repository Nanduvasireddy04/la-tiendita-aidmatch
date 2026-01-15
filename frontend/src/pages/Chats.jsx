import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Chats() {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    if (!user || !accessToken) return;

    try {
      const data = await api.listConversations(accessToken);
      setItems(Array.isArray(data) ? data : []);
      if (!data?.length) {
        setMsg("No chats yet. Open Matches and click Chat / Coordinate.");
      }
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  return (
    <div>
      <SafetyBanner />
      <h2 className="h2">Chats</h2>

      {!user && (
        <p className="warn">
          Please log in first.
        </p>
      )}

      <div className="card">
        <div className="row space">
          <div className="muted">Your previous conversations</div>
          <button className="btn primary" onClick={load} disabled={!user}>
            Refresh
          </button>
        </div>

        {msg && <p className="muted" style={{ marginTop: 10 }}>{msg}</p>}
      </div>

      {items.map((c) => {
        // determine the "other" participant
        const otherUser =
          c.recipient_user_id === user?.id
            ? c.donor_public_handle
            : c.recipient_public_handle;

        return (
          <div key={c.id} className="card">
            <div className="row space">
              <div><b>Chat</b></div>
              <span className="pill-small">{c.status ?? "open"}</span>
            </div>

            <div className="muted" style={{ marginTop: 6 }}>
              <div>
                <b>Conversation with:</b> {otherUser ?? "—"}
              </div>

              {c.offer_description && (
                <div style={{ marginTop: 4 }}>
                  <b>Offer:</b> {c.offer_description}
                </div>
              )}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <Link className="btn success" to={`/chat/${c.id}`}>
                Open Chat
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
