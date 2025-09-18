// Use relative base in dev so Vite proxy handles CORS; backend base can still be absolute in prod via env
const API_BASE = import.meta.env.VITE_API_BASE || "/api";


function getStoredToken() {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    if (token) localStorage.setItem("token", token);
  } catch {}
}

function clearStoredToken() {
  try {
    localStorage.removeItem("token");
  } catch {}
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { message: text };
  }
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const api = {
  getToken() {
    return getStoredToken();
  },
  isAuthenticated() {
    return Boolean(getStoredToken());
  },

  async signup({ name, email, password }) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    });
    return data;
  },

  async login({ email, password }) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    // Persist token for subsequent requests
    if (data && data.token) setStoredToken(data.token);
    try {
      if (data && data.user) localStorage.setItem("user", JSON.stringify(data.user));
    } catch {}
    return data;
  },

  logout() {
    clearStoredToken();
    try { localStorage.removeItem("user"); } catch {}
  },

  // Transactions
  async getTransactions() {
    return await request("/transactions", { method: "GET" });
  },

  async getTransaction(id) {
    return await request(`/transactions/${encodeURIComponent(id)}`, { method: "GET" });
  },

  async createTransaction(payload) {
    // Expecting: { title, amount:number, type: "income"|"expense"|"transfer", category?, payment_method?, notes?, transaction_date: "YYYY-MM-DD" }
    return await request("/transactions", { method: "POST", body: payload });
  },

  async updateTransaction(id, partial) {
    return await request(`/transactions/${encodeURIComponent(id)}`, { method: "PUT", body: partial });
  },

  async deleteTransaction(id) {
    return await request(`/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async getTransactionsByType(type) {
    return await request(`/transactions/type/${encodeURIComponent(type)}`, { method: "GET" });
  },

  async getTransactionsByDate(startDate, endDate) {
    return await request(`/transactions/date/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`, { method: "GET" });
  },
};

export default api;


