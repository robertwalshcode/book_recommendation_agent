"use client"; // Ensure this runs only on the client side

import { useState } from "react";
import { useRouter } from "next/navigation"; // Router for navigation

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter(); // Router instance for navigation

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to register.");
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login"); // Redirect to login page after successful registration
      }, 2000);
    } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">📝 Create an Account</h1>

      <form onSubmit={handleRegister} className="bg-gray-800 p-6 rounded-lg shadow-md w-96">
        <label className="block mb-2">Username:</label>
        <input
          type="text"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="block mb-2">Email:</label>
        <input
          type="email"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2">Password:</label>
        <input
          type="password"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="block mb-2">Confirm Password:</label>
        <input
          type="password"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4">
          Register
        </button>
      </form>

      <p className="mt-4">
        Already have an account?{" "}
        <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
          Login here
        </a>
      </p>
    </main>
  );
}
