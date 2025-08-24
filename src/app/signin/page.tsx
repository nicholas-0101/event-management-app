"use client";

import { useState } from "react";

type LoginForm = {
  email: string;
  password: string;
  stayLoggedIn: boolean;
};

const initialState: LoginForm = {
  email: "",
  password: "",
  stayLoggedIn: false,
};

export default function Signin() {
  const [form, setForm] = useState<LoginForm>(initialState);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form:", form);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-4xl font-bold text-center text-green-600 mb-8">
          TicketNest
        </h1>
        <h2 className="text-2xl font-semibold text-center mb-6">
          Sign in to viagogo
        </h2>
        <form onSubmit={handleLogin}>
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
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="stayLoggedIn"
              checked={form.stayLoggedIn}
              onChange={handleInputChange}
              name="stayLoggedIn"
              className="mr-2"
            />
            <label htmlFor="stayLoggedIn" className="text-sm">
              Stay logged in
            </label>
          </div>
          <button type="submit" className="w-full p-2 bg-gray-200 rounded">
            Sign in
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="#" className="text-blue-500 hover:underline">
            Forgot Password
          </a>
        </div>
        <div className="mt-6 text-center">
          <p>
            By signing in or creating an account, you agree to our user
            agreement and acknowledge our privacy policy. You may receive SMS
            notifications from us and can opt out at any time.
          </p>
        </div>
        <div className="mt-8 text-center">
          <button className="w-full p-2 bg-green-600 text-white rounded">
            Guest purchase? Find your order
          </button>
        </div>
        <div className="mt-4 text-center">
          <a href="/signup" className="text-blue-500 hover:underline">
            New to viagogo? Create account
          </a>
        </div>
      </div>
    </div>
  );
}
