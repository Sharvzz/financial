import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow">
      <div className="font-bold text-xl">FinTrack</div>
      <div className="space-x-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/transactions" className="hover:underline">Transactions</Link>
        <Link to="/reports" className="hover:underline">Reports</Link>
        <Link to="/profile" className="hover:underline">Profile</Link>
      </div>
    </nav>
  );
}
