
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}, accessToken) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach Supabase auth token to backend
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const api = {
  listNeeds(filters = {}, accessToken) {
    const params = new URLSearchParams();
    if (filters.city) params.append("city", filters.city);
    if (filters.zip_code) params.append("zip_code", filters.zip_code);
    if (filters.category) params.append("category", filters.category);

    const query = params.toString();
    return request(`/needs${query ? `?${query}` : ""}`, { method: "GET" }, accessToken);
  },

  createNeed(payload, accessToken) {
    return request("/needs", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  createOffer(payload, accessToken) {
    return request("/offers", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  },

  match(needId, accessToken) {
    if (!needId) throw new Error("needId missing (match)");
    const q = encodeURIComponent(needId);
    // your backend uses POST /match?need_id=...
    return request(`/match?need_id=${q}`, { method: "POST" }, accessToken);
  },
};

