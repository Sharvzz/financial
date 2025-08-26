export default function Signup(){
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-grey-300 ">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
                <h1 className="text-3xl font-bold text-center mb-6">SignUp</h1>
                <form className="flex flex-col space-y-4">
                    <input type="text" placeholder="Enter Your Name" className="rounded-xl px-4 py-2 border"/>
                    <input type="email" placeholder="Enter Your Email" className="rounded-xl px-4 py-2 border"></input>
                    <input type="password" placeholder="Enter Your Password" className="rounded-xl px-4 py-2 border"></input>
                    <input type="password" placeholder="Re-Enter Your Password" className="rounded-xl px-4 py-2 border"></input>
                    <button type="submit" className="rounded-xl w-full py-2 text-white bg-black">Create Account</button>
                </form>
            </div>
        </div>
    )
}