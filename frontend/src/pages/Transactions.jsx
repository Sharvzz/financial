import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import storage from "../services/storage";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "all", // all, income, expense
    dateFrom: "",
    dateTo: "",
    search: ""
  });
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    if (!storage.auth.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate]);

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const txRes = storage.transactions.list({ limit: 1000 }); // Get all transactions
      const expenseCats = storage.categories.list("expense");
      const incomeCats = storage.categories.list("income");
      setTransactions(Array.isArray(txRes) ? txRes : []);
      setCategories([...(Array.isArray(expenseCats) ? expenseCats : []), ...(Array.isArray(incomeCats) ? incomeCats : [])]);
    } catch (e) {
      setError(e.message || "Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }

  // Filter transactions based on current filters
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(tx => new Date(tx.occurredAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(tx => new Date(tx.occurredAt) <= new Date(filters.dateTo + "T23:59:59"));
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchLower) ||
        getCategoryName(tx.categoryId)?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

    setFilteredTransactions(filtered);
  }, [transactions, filters, categories]);

  function getCategoryName(categoryId) {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Unknown Category";
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      type: "all",
      dateFrom: "",
      dateTo: "",
      search: ""
    });
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h2>
        <p className="text-gray-600">View and manage all your financial transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Transactions</option>
              <option value="income">Income (Credit)</option>
              <option value="expense">Expense (Debit)</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search description or category..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">No transactions found</div>
            <div className="text-gray-400">Try adjusting your filters or add some transactions</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {transaction.description || 'No description'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getCategoryName(transaction.categoryId)} • {formatDate(transaction.occurredAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {transaction.type === 'income' ? 'Credit' : 'Debit'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
