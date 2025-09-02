// Simple localStorage-based data layer for auth, categories, transactions, and summary

const STORAGE_KEYS = {
  users: "fin_users", // array of {id, name, email, passwordHash}
  token: "access_token", // stores user's email as token for simplicity
  categories: "fin_categories", // array of {id, userEmail, name, type, createdAt}
  transactions: "fin_transactions", // array of {id, userEmail, type, amount, categoryId, description, occurredAt, createdAt, updatedAt}
};

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return Math.floor(Math.random() * 1e9);
}

// Password hashing placeholder – do NOT use in production
function hashPassword(pwd) {
  return `hash:${btoa(unescape(encodeURIComponent(pwd)))}`;
}

function verifyPassword(pwd, hash) {
  try {
    return hash === hashPassword(pwd);
  } catch {
    return false;
  }
}

export const auth = {
  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.token) || "";
    } catch {
      return "";
    }
  },
  isAuthenticated() {
    return Boolean(this.getToken());
  },
  login: async (email, password) => {
    const users = readArray(STORAGE_KEYS.users);
    const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid credentials");
    }
    localStorage.setItem(STORAGE_KEYS.token, user.email);
    return { access_token: user.email, token_type: "bearer" };
  },
  signup: async ({ name, email, password }) => {
    const users = readArray(STORAGE_KEYS.users);
    const exists = users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) throw new Error("Email already registered");
    const user = {
      id: generateId(),
      name: String(name || "").trim() || "User",
      email: String(email).toLowerCase().trim(),
      passwordHash: hashPassword(String(password)),
      createdAt: nowIso(),
    };
    users.push(user);
    writeArray(STORAGE_KEYS.users, users);
    return { id: user.id, name: user.name, email: user.email };
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
  },
  currentUserEmail() {
    return this.getToken() || null;
  },
};

export const categories = {
  list: (type) => {
    const userEmail = auth.currentUserEmail();
    const all = readArray(STORAGE_KEYS.categories).filter((c) => c.userEmail === userEmail);
    return type ? all.filter((c) => c.type === type) : all;
  },
  upsertByName: (type, name) => {
    const userEmail = auth.currentUserEmail();
    if (!userEmail) throw new Error("Not authenticated");
    const trimmed = String(name || "").trim();
    if (!trimmed) return null;
    const all = readArray(STORAGE_KEYS.categories);
    let cat = all.find((c) => c.userEmail === userEmail && c.type === type && c.name.toLowerCase() === trimmed.toLowerCase());
    if (!cat) {
      cat = { id: generateId(), userEmail, name: trimmed, type, createdAt: nowIso() };
      all.push(cat);
      writeArray(STORAGE_KEYS.categories, all);
    }
    return cat;
  },
};

export const transactions = {
  add: ({ type, amount, categoryId, categoryName, description, occurredAt }) => {
    const userEmail = auth.currentUserEmail();
    if (!userEmail) throw new Error("Not authenticated");
    const list = readArray(STORAGE_KEYS.transactions);
    let resolvedCategoryId = categoryId || null;
    if (!resolvedCategoryId && categoryName) {
      const cat = categories.upsertByName(type, categoryName);
      resolvedCategoryId = cat ? cat.id : null;
    }
    const tx = {
      id: generateId(),
      userEmail,
      type,
      amount: Number(amount) || 0,
      categoryId: resolvedCategoryId,
      description: description || null,
      occurredAt: occurredAt || nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    list.push(tx);
    writeArray(STORAGE_KEYS.transactions, list);
    return tx;
  },
  list: ({ limit = 20, offset = 0 } = {}) => {
    const userEmail = auth.currentUserEmail();
    const all = readArray(STORAGE_KEYS.transactions).filter((t) => t.userEmail === userEmail);
    const ordered = all.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    return ordered.slice(offset, offset + limit);
  },
};

export const summary = {
  get: (range = "last_30_days") => {
    const userEmail = auth.currentUserEmail();
    const all = readArray(STORAGE_KEYS.transactions).filter((t) => t.userEmail === userEmail);
    const now = new Date();
    let start;
    if (range === "last_30_days") start = new Date(now.getTime() - 30 * 86400000);
    else if (range === "last_90_days") start = new Date(now.getTime() - 90 * 86400000);
    else if (range === "ytd") start = new Date(now.getFullYear(), 0, 1);
    else start = new Date(now.getTime() - 30 * 86400000);

    const inRange = all.filter((t) => new Date(t.occurredAt) >= start && new Date(t.occurredAt) <= now);
    const income = inRange.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expenses = inRange.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);

    const totalIncome = all.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = all.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalBalance = totalIncome - totalExpense;

    // last 12 months trend
    const months = [];
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 0; i < 12; i += 1) {
      const label = `${cursor.getFullYear().toString().padStart(4, "0")}-${(cursor.getMonth() + 1).toString().padStart(2, "0")}`;
      months.push({ month: label, income: 0, expense: 0 });
      cursor.setMonth(cursor.getMonth() - 1);
    }
    months.reverse();
    const bucket = Object.fromEntries(months.map((m) => [m.month, m]));
    for (const t of all) {
      const d = new Date(t.occurredAt);
      const label = `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      if (bucket[label]) {
        if (t.type === "income") bucket[label].income += Number(t.amount || 0);
        else bucket[label].expense += Number(t.amount || 0);
      }
    }

    const savingsRate = income > 0 ? Math.max(0, 1 - expenses / income) : 0;

    return {
      totalBalance: Number(totalBalance.toFixed(2)),
      monthlyIncome: Number(income.toFixed(2)),
      monthlyExpenses: Number(expenses.toFixed(2)),
      savingsRate: Number(savingsRate.toFixed(3)),
      trend: months,
    };
  },
};

export default {
  auth,
  categories,
  transactions,
  summary,
};


