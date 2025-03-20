"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); // Router for navigation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access); // Store access token
      localStorage.setItem("refreshToken", data.refresh); // Store refresh token
      router.push("/"); // Redirect to home page
    } catch (err) {
      setError("Failed to login. Please check your credentials.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">🔐 Login</h1>

      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <label className="block mb-2">Username:</label>
        <input
          type="text"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
          placeholder="Enter Username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="block mb-2">Password:</label>
        <input
          type="password"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
          placeholder="Enter Password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* 🔹 Buttons in Flex Row Layout */}
        <div className="flex justify-between mt-4">
          <button type="submit" className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600">
            Login
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600"
          >
            Sign Up
          </button>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </form>
    </div>
  );
}
