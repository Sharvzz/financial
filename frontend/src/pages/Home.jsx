export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to FinTrack</h1>
      <p className="text-lg max-w-xl">
        FinTrack helps you manage your personal finances with ease. Track your income, expenses, view insightful reports, and take control of your financial future.
      </p>
      <br />
      <br />

      <div className="flex flex-row justify-between space-x-5">
        <button className="bg-black text-white px-4 py-2 rounded-xl hover:bg-white hover:text-black">Login</button> 
        <button className="bg-black text-white px-4 py-2 rounded-xl hover:bg-white hover:text-black">Sign Up</button>
      </div>
    </div>
  );
}
