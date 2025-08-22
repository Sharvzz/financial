import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-grey-600 text-white px-4 py-3 flex justify-between items-center shadow">
      <div className="font-bold text-xl text-black">FinTrack</div>
      <div className="space-x-4 flex justify-between" >
        <Link to="/" className="text-black font-semibold">Home</Link>
        <Link to="/dashboard" className="text-black font-semibold">Dashboard</Link>
        <Link to="/transactions" className="text-black font-semibold">Transactions</Link>
        <Link to="/reports" className="text-black font-semibold">Reports</Link>
        <Link to="/profile"> <img src="./src/assets/images/user.png" alt="user" className="w-5 h-5" /></Link>
      </div>
    </nav>
  );
}
