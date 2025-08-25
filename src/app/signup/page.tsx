// src/pages/signup.tsx
"use client";
import { useState } from "react";
import { apiCall } from "@/helper/axios";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md p-8 bg-white shadow-md rounded-3xl">
        <h2 className="text-2xl font-semibold text-center mb-6 text-[#09431C]">
          Create an account
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSignup} className=" flex flex-col gap-10">
          <div className=" flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleInputChange}
              name="username"
              className="w-full p-2 border rounded-lg"
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleInputChange}
              name="email"
              className="w-full p-2 border rounded-lg"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
              name="password"
              className="w-full p-2 border rounded-lg"
              required
            />
            <Select
              name="role"
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger className="w-full rounded-lg border p-2">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full p-2 bg-[#6FB229] hover:bg-[#09431C] rounded-lg">
            Sign up
          </Button>
        </form>

        <div className="flex justify-center">
          <p className="text-[#09431C] flex flex-col justify-center">
            Already have an account?
          </p>
          <a href="/signin">
            <Button
              type="button"
              variant={"link"}
              className="text-[#6FB229] hover:text-grey-400 p-0 pl-1.5"
            >
              Sign In
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
