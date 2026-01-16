const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}, accessToken) {
  const url = `${BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { ...options, headers });

  // parse json safely
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail =
      (data && data.detail) ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
      : (data && data.message) ? data.message
      : (typeof data === "string" && data) ? data
      : "Request failed";
    throw new Error(detail);
  }

  return data;
}

// remove undefined/null/"" so URLSearchParams never sends "undefined"
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
}

export const api = {
  createNeed(payload, accessToken) {
    return request("/needs", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  createOffer(payload, accessToken) {
    return request("/offers", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  match(needId, accessToken) {
    return request(`/match?need_id=${needId}`, { method: "POST" }, accessToken);
  },

  listNeeds(params = {}, accessToken) {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return request(qs ? `/needs?${qs}` : "/needs", { method: "GET" }, accessToken);
  },

  listOffers(params = {}, accessToken) {
    const qs = new URLSearchParams(cleanParams(params)).toString();
    return request(qs ? `/offers?${qs}` : "/offers", { method: "GET" }, accessToken);
  },

  // chat
  createConversation(payload, accessToken) {
    return request("/conversations", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  listMessages(conversationId, accessToken) {
    return request(`/conversations/${conversationId}/messages`, { method: "GET" }, accessToken);
  },

  sendMessage(conversationId, payload, accessToken) {
    return request(
      `/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify(payload) },
      accessToken
    );
  },

  listConversations(accessToken) {
    return request("/conversations", { method: "GET" }, accessToken);
  },
};
