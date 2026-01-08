const BASE = import.meta.env.VITE_API_BASE;

function withParams(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

async function request(method, path, { params, body } = {}) {
  const url = withParams(path, params);
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const detail = data?.detail ? JSON.stringify(data.detail) : (typeof data === "string" ? data : JSON.stringify(data));
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return data;
}

export const api = {
  signup: (payload) => request("POST", "/signup", { body: payload }),
  login: (anonymous_handle) => request("POST", "/login", { params: { anonymous_handle } }),

  createNeed: (anonymous_handle, payload) =>
    request("POST", "/needs", { params: { anonymous_handle }, body: payload }),

  createOffer: (anonymous_handle, payload) =>
    request("POST", "/offers", { params: { anonymous_handle }, body: payload }),

  listNeeds: (filters) => request("GET", "/needs", { params: filters }),
  listOffers: (filters) => request("GET", "/offers", { params: filters }),

  match: (need_id) => request("POST", "/match", { params: { need_id } }),
};
