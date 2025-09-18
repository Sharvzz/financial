import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [form, setForm] = useState({ type: "expense", amount: "", category: "", description: "" });
  const [isListening, setIsListening] = useState(false);
  const [isSpeechApiAvailable, setIsSpeechApiAvailable] = useState(typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  const recognitionRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const selectedType = form.type;

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => c.type === selectedType)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [categories, selectedType]);

  // Check if user is authenticated
  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate]);

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const all = await api.getTransactions();
      const normalized = Array.isArray(all)
        ? all.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            description: t.notes || t.title || "",
            occurredAt: t.transaction_date || t.created_at || t.createdAt,
          }))
        : [];
      // compute summary for last 30 days
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 86400000);
      const inRange = normalized.filter((t) => new Date(t.occurredAt) >= start && new Date(t.occurredAt) <= now);
      const monthlyIncome = inRange.filter((t) => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const monthlyExpenses = inRange.filter((t) => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalIncome = normalized.filter((t) => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalExpense = normalized.filter((t) => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalBalance = totalIncome - totalExpense;
      // trend for last 12 months
      const months = [];
      const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let i = 0; i < 12; i += 1) {
        const label = `${cursor.getFullYear().toString().padStart(4, "0")}-${(cursor.getMonth() + 1).toString().padStart(2, "0")}`;
        months.push({ month: label, income: 0, expense: 0 });
        cursor.setMonth(cursor.getMonth() - 1);
      }
      months.reverse();
      const bucket = Object.fromEntries(months.map((m) => [m.month, m]));
      for (const t of normalized) {
        const d = new Date(t.occurredAt);
        const label = `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        if (bucket[label]) {
          if (t.type === "income") bucket[label].income += Number(t.amount) || 0;
          else if (t.type === "expense") bucket[label].expense += Number(t.amount) || 0;
        }
      }
      const savingsRate = monthlyIncome > 0 ? Math.max(0, 1 - monthlyExpenses / monthlyIncome) : 0;
      setSummary({
        totalBalance: Number(totalBalance.toFixed(2)),
        monthlyIncome: Number(monthlyIncome.toFixed(2)),
        monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
        savingsRate: Number(savingsRate.toFixed(3)),
        trend: months,
      });
      setTransactions(normalized.slice(0, 5));
      setCategories([]);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = parseFloat(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const transaction_date = `${yyyy}-${mm}-${dd}`;
      const payload = {
        title: (form.description || form.category || form.type || "").slice(0, 100) || "Transaction",
        amount: parsedAmount,
        type: form.type,
        category: form.category?.trim() || undefined,
        notes: form.description?.trim() || undefined,
        transaction_date,
      };
      await api.createTransaction(payload);
      // Clear form first
      setForm({ type: "expense", amount: "", category: "", description: "" });
      
      // Force refresh all data
      await loadData();
      
      // Show success message
      alert("Transaction added successfully! Dashboard updated.");
      
    } catch (e) {
      alert(e.message || "Failed to save transaction");
    }
  };

  const startListening = () => {
    if (!isSpeechApiAvailable) return;
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Basic parsing: "expense 50 food" or "income 1200 salary"
        const tokens = transcript.trim().toLowerCase().split(/\s+/);
        if (tokens.length >= 3 && (tokens[0] === "expense" || tokens[0] === "income")) {
          const maybeAmount = parseFloat(tokens[1].replace(/[^0-9.]/g, ""));
          const category = tokens.slice(2).join(" ");
          setForm((prev) => ({
            ...prev,
            type: tokens[0],
            amount: Number.isNaN(maybeAmount) ? prev.amount : String(maybeAmount),
            category: category || prev.category,
            description: transcript,
          }));
        } else {
          setForm((prev) => ({ ...prev, description: transcript }));
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsSpeechApiAvailable(false);
    }
  };

  // Helper function to get category name from categoryId
  const getCategoryName = (categoryId) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  };

  if (error && !api.isAuthenticated()) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={loadData}
            disabled={isLoading}
            className={`px-3 py-1 text-sm rounded-md transition ${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <span>Last updated:</span>
            <span className="font-medium text-gray-700">
              {isLoading ? "Updating..." : "just now"}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Total Balance</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">${summary ? summary.totalBalance.toFixed(2) : "—"}</div>
          <div className="mt-1 text-xs text-gray-600">{isLoading ? "Loading..." : ""}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Monthly Income</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">${summary ? summary.monthlyIncome.toFixed(2) : "—"}</div>
          <div className="mt-1 text-xs text-gray-600">{isLoading ? "Loading..." : ""}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Monthly Expenses</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">${summary ? summary.monthlyExpenses.toFixed(2) : "—"}</div>
          <div className="mt-1 text-xs text-gray-600">{isLoading ? "Loading..." : ""}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Savings Rate</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{summary ? `${(summary.savingsRate * 100).toFixed(1)}%` : "—"}</div>
          <div className="mt-1 text-xs text-gray-500">{isLoading ? "Loading..." : "Target: 40%"}</div>
        </div>
      </section>

      {/* Chart + Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Spending Overview</h3>
            <select className="border border-gray-200 rounded-md text-sm px-2 py-1 text-gray-700 focus:outline-none">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Year to date</option>
            </select>
          </div>
          <div className="mt-6 h-56 sm:h-64 md:h-72 grid grid-cols-12 items-end gap-2">
            {/* Simple bar chart using summary.trend */}
            {(summary?.trend || []).map((m, idx) => {
              const income = m.income || 0;
              const expense = m.expense || 0;
              const max = Math.max(income, expense, 1);
              const incomeHeight = Math.round((income / max) * 80) + 10;
              const expenseHeight = Math.round((expense / max) * 80) + 10;
              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full">
                  <div className="w-full flex gap-1 items-end">
                    <div className="flex-1 bg-indigo-500/80 rounded-t" style={{ height: `${incomeHeight}%` }} />
                    <div className="flex-1 bg-rose-500/80 rounded-t" style={{ height: `${expenseHeight}%` }} />
                  </div>
                  <span className="mt-2 text-[10px] text-gray-500">{m.month?.slice(5) || idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 font-medium">Category</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(transactions || []).map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="py-2 text-gray-700">{new Date(row.occurredAt).toISOString().slice(0,10)}</td>
                    <td className="py-2 text-gray-700">{row.description || (row.type === "income" ? "Income" : "Expense")}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {getCategoryName(row.categoryId) || (row.type === "income" ? "Income" : "Expense")}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-medium ${row.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                      {row.type === "expense" ? "-" : "+"}${Number(row.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <a href="/transactions" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View all</a>
          </div>
        </div>
      </section>

      {/* Quick Add Transaction */}
      <section className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quick Add Transaction</h3>
          <button
            type="button"
            onClick={startListening}
            disabled={!isSpeechApiAvailable}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              isSpeechApiAvailable ? (isListening ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700") : "bg-gray-100 text-gray-400"
            }`}
            title={isSpeechApiAvailable ? (isListening ? "Listening..." : "Speak to fill fields") : "Voice input not supported in this browser"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0 0 19 11h-2Z" />
            </svg>
            {isSpeechApiAvailable ? (isListening ? "Listening..." : "Mic") : "Mic N/A"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              value={form.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleInputChange}
              placeholder="e.g., Food, Salary"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Description (voice supported)</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Say: 'expense 50 food' or describe the transaction"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </div>

          <div className="md:col-span-5 flex justify-end mt-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      {/* Budgets / Goals */}
      {/* <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900">Budget Progress</h3>
          <div className="mt-4 space-y-3">
            {[{ name: "Food", used: 65 }, { name: "Transport", used: 40 }, { name: "Entertainment", used: 80 }].map((b) => (
              <div key={b.name}>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>{b.name}</span>
                  <span>{b.used}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-gray-100">
                  <div className="h-2 rounded bg-indigo-500" style={{ width: `${b.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
          <ul className="mt-4 space-y-3">
            {[{ title: "Emergency Fund", progress: 72, target: "$10,000" }, { title: "Vacation", progress: 35, target: "$3,000" }].map((g) => (
              <li key={g.title} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{g.title}</div>
                    <div className="text-xs text-gray-500">Target {g.target}</div>
                  </div>
                  <div className="text-sm text-gray-700">{g.progress}%</div>
                </div>
                <div className="mt-2 h-2 w-full rounded bg-gray-100">
                  <div className="h-2 rounded bg-green-500" style={{ width: `${g.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section> */}
    </div>
  );
}
