import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import api from "./services/api";

// Simple protected route component
function ProtectedRoute({ children }) {
  const isAuthed = api.isAuthenticated();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Navbar />
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Navbar />
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Navbar />
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login/>}></Route>
            <Route path="/signup" element={<Signup/>}></Route>
          </Routes>
        </main>

        {/* Footer intentionally omitted in local prototype */}
      </div>
    </Router>
  );
}

export default App;
