import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bali from "../assets/Bali.jpg";
import { loginUser, registerUser } from "../api";


const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // REGISTER
    if (!isLogin) {
      if (password !== confirmPass) {
        return alert("Password and Confirm Password do not match");
      }

      const res = await registerUser({ name, email, password });
      if (res.token) {
        alert("Registration Successful!");
        setIsLogin(true);
      } else {
        alert(res.msg || "Registration Failed");
      }
      return;
    }

    // LOGIN
    const res = await loginUser({ email, password });

    if (!res.token) {
      return alert(res.msg || "Invalid Credentials");
    }

    // Save auth locally
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));

    // Check if admin login requested
    if (isAdmin) {
      if (res.user.role === "admin") {
        alert("Admin Login Successful!");
        navigate("/admin/dashboard");
      } else {
        alert("You are not an Admin!");
      }
    } else {
      alert("Login Successful!");
      navigate("/");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bali})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-600">
            India Pilgrimage Travel
          </h1>
          <p className="text-gray-600">Plan your spiritual journey to sacred sites</p>
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
              !isLogin ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          {/* Admin checkbox only in Login mode */}
          {isLogin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="adminLogin"
                checked={isAdmin}
                onChange={() => setIsAdmin(!isAdmin)}
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
