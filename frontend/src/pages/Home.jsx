import {Link} from "react-router-dom";
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] text-center bg-[url('/bg-home.jpg')] bg-cover ">
      <h1 className="text-4xl font-bold mb-4 text-white">Welcome to Credora</h1>
      <p className="text-lg max-w-xl text-white">
        Credora helps you manage your personal finances with ease. Track your income, expenses, view insightful reports, and take control of your financial future.
      </p>
      <br />
      <br />

      <div className="flex flex-row justify-between space-x-5">
        <Link to="/login"><button className="bg-black text-white px-4 py-2 rounded-xl hover:bg-white hover:text-black hover:border hover:black">Login</button> </Link>
        <Link to="/signup"><button className="bg-black text-white px-4 py-2 rounded-xl hover:bg-white hover:text-black hover:border hover:black">Sign Up</button></Link>
      </div>
    </div>
  );
}
