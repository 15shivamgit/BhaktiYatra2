import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation (install react-router-dom)
import bali from "../assets/Bali.jpg";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register
  const [isAdmin, setIsAdmin] = useState(false); // Admin checkbox
  const [email, setEmail] = useState(""); // Controlled input for email
  const [password, setPassword] = useState(""); // Controlled input for password
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin && isAdmin) {
      // Check admin credentials
      if (email === "15shivambgs@gmail.com" && password === "admin@123") {
        navigate("/AdminDashboard"); // Redirect to admin dashboard
      } else {
        alert("Invalid admin credentials! Please check email and password.");
      }
    } else {
      // Regular user login/register (demo alert)
      alert(isLogin ? "User logged in!" : "User registered!");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bali})` }}
    >
      {/* Semi-transparent overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Form Card */}
      <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-600">
            India Pilgrimage Travel
          </h1>
          <p className="text-gray-600">
            Plan your spiritual journey to sacred sites
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-l-lg focus:outline-none ${
              isLogin ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-r-lg focus:outline-none ${
              !isLogin
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!isLogin}
              />
            </div>
          )}
          {isLogin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="adminLogin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="adminLogin" className="text-sm text-gray-600">
                Admin Login
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Forgot password?{" "}
          <a href="#" className="text-orange-500">
            Reset here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
