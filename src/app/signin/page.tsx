"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiCall } from "@/helper/axios";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { SignInSchema, ISignInValue } from "./SigninSchema";

export default function Signin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignin = async (values: ISignInValue) => {
    try {
      setError("");
      const res = await apiCall.post("/auth/signin", values);

      console.log("Login response:", res.data);

      const user = res.data?.data?.user;
      const token = res.data?.data?.token;

      if (!user || !token) {
        setError("Login failed: user data not received");
        return;
      }

      // Simpan token
      localStorage.setItem("token", token);

      // Simpan user info sesuai Prisma schema
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        is_verified: user.is_verified,
        referral_code: user.referral_code ?? null,
        points: user.points ?? 0,
        profile_pic: user.profile_pic ?? null,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      router.replace("/"); // arahkan ke homepage
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to sign in. Please try again."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md p-8 bg-white shadow-md rounded-3xl">
        <h2 className="text-2xl font-semibold text-center mb-6 text-[#09431C]">
          Sign in to your account
        </h2>

        <Formik<ISignInValue>
          initialValues={{ email: "", password: "" }}
          validationSchema={SignInSchema}
          onSubmit={handleSignin}
        >
          {({ errors, touched, values, handleChange }) => (
            <Form className="flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label className="text-[#09431C]">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Your email"
                    value={values.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg"
                  />
                  {errors.email && touched.email && (
                    <span className="text-red-400 italic text-sm">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <Label className="text-[#09431C]">Password</Label>
                  <div className="relative w-full">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Your password"
                      value={values.password}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-2 text-gray-500 hover:text-black w-1 h-1"
                      variant="ghost"
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </Button>
                  </div>
                  {errors.password && touched.password && (
                    <span className="text-red-400 italic text-sm">
                      {errors.password}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0">
                <Label className="text-red-400 mb-4 font-normal italic">
                  {error}
                </Label>
                <Button
                  type="submit"
                  className="w-full p-2 bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
                >
                  Sign In
                </Button>
              </div>
            </Form>
          )}
        </Formik>

        {/* Footer */}
        <div className="flex justify-center mt-4">
          <p className="text-[#09431C] flex flex-col justify-center">
            Don't have an account?
          </p>
          <a href="/signup">
            <Button
              type="button"
              variant="link"
              className="text-[#6FB229] hover:text-grey-400 p-0 pl-1.5"
            >
              Sign Up
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
