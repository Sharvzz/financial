import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
      // You could decode the JWT to get user info, but for now we'll just show a generic name
      setUserName("User");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    setUserName("");
    navigate("/login");
  };

  return (
    <nav className=" bg-black px-4 py-3 flex justify-between items-center shadow">
      <div className=" text-xl text-white font-semibold">FinTrack</div>
      <div className="space-x-4 flex items-center">
        {isAuthenticated ? (
          <>
            <Link to="/" className="text-white  hover:text-gray-200">Home</Link>
            <Link to="/dashboard" className="text-white  hover:text-gray-200">Dashboard</Link>
            <Link to="/transactions" className="text-white  hover:text-gray-200">Transactions</Link>
            <Link to="/reports" className="text-white  hover:text-gray-200">Reports</Link>
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm">Welcome, {userName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/" className="text-white text-base hover:text-gray-200">Home</Link>
            <Link to="/login" className="text-white text-base  hover:text-gray-200">Login</Link>
            <Link to="/signup" className="text-white text-base hover:text-gray-200">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
