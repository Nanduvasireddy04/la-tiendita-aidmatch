import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SafetyBanner from "../components/SafetyBanner";
import { api } from "../api/client";
import { useAuth } from "../auth/authprovider";

export default function Chat() {
  const { conversationId } = useParams();
  const { user, accessToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);

  // ✅ If user opens /chat directly without a conversation id
  if (!conversationId || conversationId === "undefined") {
    return (
      <div>
        <SafetyBanner />
        <h2 className="h2">Chat</h2>
        <div className="card">
          <p className="warn">Open a conversation from the Chats list.</p>
          <Link className="btn outline" to="/chats">
            Go to Chats
          </Link>
        </div>
      </div>
    );
  }

  async function load() {
    if (!accessToken) return;
    try {
      const data = await api.listMessages(conversationId, accessToken);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function send(e) {
    e.preventDefault();
    setMsg("");

    if (!user || !accessToken) {
      setMsg("❌ Please log in first.");
      return;
    }

    const body = draft.trim();
    if (!body) return;

    try {
      await api.sendMessage(conversationId, { body }, accessToken);
      setDraft("");
      await load(); // refresh after sending
    } catch (e2) {
      setMsg(`❌ ${e2.message}`);
    }
  }

  // ✅ Simple polling (no realtime, no websocket)
  useEffect(() => {
    if (!user || !accessToken) return;
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, accessToken, conversationId]);

  // ✅ Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  return (
    <div>
      <SafetyBanner />

      <div className="row space" style={{ marginTop: 6 }}>
        <h2 className="h2" style={{ margin: 0 }}>
          Chat
        </h2>
        <Link className="btn outline" to="/chats">
          ← Back
        </Link>
      </div>

      <div className="card chat-shell">
        <div className="chat-messages">
          {messages.map((m) => {
            const mine = m.sender_user_id === user?.id;
            return (
              <div key={m.id} className={`bubble ${mine ? "mine" : "theirs"}`}>

                <div className="bubble-meta">
                  {m.sender_user_id
                    ? `user_${String(m.sender_user_id).slice(0, 6)}`
                    : "user"}
                </div>


                <div>{m.body}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            disabled={!user}
          />
          <button className="btn primary" disabled={!user}>
            Send
          </button>
        </form>

        {msg && (
          <p className="warn" style={{ marginTop: 8 }}>
            {msg}
          </p>
        )}

        <p className="muted" style={{ marginTop: 10 }}>
          Safety: meet at a library/community center. Don’t share home addresses.
        </p>
      </div>
    </div>
  );
}
