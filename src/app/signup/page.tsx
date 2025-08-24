// src/pages/signup.tsx
"use client";
import { useState } from "react";
import { apiCall } from "@/helper/axios";

type SignupForm = {
  username: string;
  email: string;
  password: string;
  role: string;
};

const initialState: SignupForm = {
  username: "",
  email: "",
  password: "",
  role: "USER",
};

export default function Signup() {
  const [form, setForm] = useState<SignupForm>(initialState);
  const [error, setError] = useState<string>("");

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const response = await apiCall.post("/auth/signup", form);
      if (response.status === 200 || response.status === 201) {
        const data = response.data;
        console.log("Signup successful:", data);
        alert(
          "Signup successful! Please check your email to verify your account."
        );
      } else {
        console.error("Signup failed:", response.status, response.data);
        setError(JSON.stringify(response.data.errors, null, 2));
      }
    } catch (error: any) {
      console.error("Error during signup:", error);
      setError(error.message || "An unknown error occurred during signup.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-4xl font-bold text-center text-green-600 mb-8">
          viagogo
        </h1>
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create an account
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleInputChange}
            name="username"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleInputChange}
            name="email"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleInputChange}
            name="password"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={handleInputChange}
            className="w-full p-2 mb-4 border rounded"
            required
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="ORGANIZER">Organizer</option>
          </select>
          <button type="submit" className="w-full p-2 bg-gray-200 rounded">
            Sign up
          </button>
        </form>
        <div className="mt-4 text-center">
          <button className="w-full p-2 bg-green-600 text-white rounded">
            Guest purchase? Find your order
          </button>
        </div>
        <div className="mt-4 text-center">
          <button className="w-full p-2 bg-blue-600 text-white rounded">
            Log In with Facebook
          </button>
        </div>
        <div className="mt-4 text-center">
          <a href="#" className="text-blue-500 hover:underline">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
