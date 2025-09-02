import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import storage from "../services/storage";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (storage.auth.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long!" });
      setIsLoading(false);
      return;
    }

    try {
      const data = await storage.auth.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      // Show success message
      setMessage({ 
        type: "success", 
        text: `Registration successful! Welcome ${data.name}. Redirecting to login...` 
      });
      
      // Navigate to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Registration failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-300">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">SignUp</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success" 
              ? "bg-green-100 text-green-700 border border-green-200" 
              : "bg-red-100 text-red-700 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Enter Your Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="rounded-xl px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="rounded-xl px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Enter Your Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="rounded-xl px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-Enter Your Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className="rounded-xl px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-xl w-full py-2 text-white transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}