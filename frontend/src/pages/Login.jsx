export default function Login() {
    return (
      <div className="h-screen  w-screen flex items-center justify-center bg-gray-300">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
          <form className="flex flex-col space-y-4">
            <input type="email" placeholder="Enter Email" className="px-4 py-2 border rounded-xl  "></input>
            <input type="password" placeholder="Enter Password" className="px-4 py-2 border rounded-xl "></input>
            <button type="submit" className="w-full border bg-black text-white rounded-xl py-2 hover:bg-grey-800 transition">Login</button>
          </form>
        </div>
      </div>
    );
  }
  