const BASE = import.meta.env.VITE_API_BASE_URL;

async function request(path, options = {}, accessToken) {
  const url = `${BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // try parse json; if not json, fallback
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = data?.detail ? JSON.stringify(data) : (data?.message || data || "Request failed");
    throw new Error(detail);
  }

  return data;
}

export const api = {
  // existing
  createNeed(payload, accessToken) {
    return request("/needs", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  createOffer(payload, accessToken) {
    return request("/offers", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  match(needId, accessToken) {
    return request(`/match?need_id=${needId}`, { method: "POST" }, accessToken);
  },

  listNeeds(params, accessToken) {
    const qs = new URLSearchParams(params).toString();
    return request(`/needs?${qs}`, { method: "GET" }, accessToken);
  },

  // ✅ chat
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
