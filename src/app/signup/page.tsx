// src/pages/signup.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiCall } from "@/helper/axios";
import { Formik, Form, FormikProps } from "formik";
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
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { SignUpSchema, ISignUpValue } from "./SignupSchema";

type SignupForm = {
  username: string;
  email: string;
  password: string;
  referral: string;
  role: string;
};

const initialState: SignupForm = {
  username: "",
  email: "",
  password: "",
  referral: "",
  role: "USER",
};

export default function Signup() {
  const [form, setForm] = useState<SignupForm>(initialState);
  const [error, setError] = useState<string>("");
  const [fieldError, setFieldError] = useState<{
    username?: string;
    email?: string;
    password?: string;
    referral?: string;
    role?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const user = JSON.parse(userData);

          // If user is already verified and logged in, redirect based on role
          if (user.is_verified) {
            if (user.role === "ORGANIZER") {
              router.replace("/event-organizer");
            } else {
              router.replace("/");
            }
            return;
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSignup = async (values: ISignUpValue) => {
    setError("");
    setFieldError({});
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // Transform data to match backend expectations
      const signupData = {
        email: values.email,
        password: values.password,
        username: values.username,
        role: values.role,
        referralCode: values.referral || undefined, // Map referral to referralCode
      };

      console.log("Sending signup data:", signupData);

      const response = await apiCall.post("/auth/signup", signupData);

      if (response.status === 201) {
        console.log("Signup successful:", response.data);

        // Store user data for potential use
        const userData = response.data.user;
        if (userData) {
          localStorage.setItem("tempUserData", JSON.stringify(userData));
        }

        // Show success message if there's a referral reward
        if (response.data.referralReward) {
          setSuccessMessage(
            `Registration successful! ${response.data.referralReward}`
          );
          setTimeout(() => {
            router.replace("/pre-verify");
          }, 2000);
        } else {
          setSuccessMessage(
            "Registration successful! Please check your email to verify your account."
          );
          setTimeout(() => {
            router.replace("/pre-verify");
          }, 2000);
        }
      } else {
        console.error("Signup failed:", response.status, response.data);
        setError(response.data.message || "Signup failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Error during signup:", error);

      // Handle different types of errors based on backend response
      let errorMessage = "An error occurred during signup. Please try again.";
      let newFieldError: {
        username?: string;
        email?: string;
        password?: string;
        referral?: string;
        role?: string;
      } = {};

      if (error.response?.status === 400) {
        // Handle validation errors from backend
        if (error.response?.data?.errors) {
          // Handle express-validator errors
          const validationErrors = error.response.data.errors;
          const usernameError = validationErrors.find(
            (err: any) => err.path === "username"
          );
          const emailError = validationErrors.find(
            (err: any) => err.path === "email"
          );
          const passwordError = validationErrors.find(
            (err: any) => err.path === "password"
          );
          const roleError = validationErrors.find(
            (err: any) => err.path === "role"
          );

          if (usernameError) {
            newFieldError.username = usernameError.msg;
          } else if (emailError) {
            newFieldError.email = emailError.msg;
          } else if (passwordError) {
            newFieldError.password = passwordError.msg;
          } else if (roleError) {
            newFieldError.role = roleError.msg;
          } else {
            errorMessage =
              validationErrors[0]?.msg ||
              "Invalid data provided. Please check your input.";
          }
        } else if (error.response?.data?.message) {
          // Handle specific field errors from backend
          if (error.response?.data?.field === "email") {
            newFieldError.email = error.response.data.message;
          } else if (error.response?.data?.field === "username") {
            newFieldError.username = error.response.data.message;
          } else {
            errorMessage = error.response.data.message;
          }
        } else {
          errorMessage = "Invalid data provided. Please check your input.";
        }
      } else if (error.response?.status === 409) {
        errorMessage =
          "Email or username already exists. Please try a different one.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
      setFieldError(newFieldError);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6FB229]"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md p-8 bg-white shadow-md rounded-3xl">
        <h2 className="text-2xl font-semibold text-center mb-6 text-[#09431C]">
          Create an account
        </h2>

        <Formik<ISignUpValue>
          initialValues={{
            username: "",
            email: "",
            password: "",
            referral: "",
            role: "",
          }}
          validationSchema={SignUpSchema}
          onSubmit={handleSignup}
        >
          {(props) => {
            const { errors, touched, values, handleChange, setFieldValue } =
              props;
            return (
              <Form className="flex flex-col gap-10">
                <div className="flex flex-col gap-4">
                  {/* Username */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#09431C]">Username</Label>
                    <Input
                      type="text"
                      name="username"
                      placeholder="Create a new username"
                      value={values.username}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                    />
                    {(errors.username && touched.username) || fieldError.username ? (
                      <span className="text-red-400 italic text-sm">
                        {fieldError.username || errors.username}
                      </span>
                    ) : null}
                  </div>

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
                    {(errors.email && touched.email) || fieldError.email ? (
                      <span className="text-red-400 italic text-sm">
                        {fieldError.email || errors.email}
                      </span>
                    ) : null}
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
                        variant={"ghost"}
                      >
                        {showPassword ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )}
                      </Button>
                    </div>
                    {(errors.password && touched.password) || fieldError.password ? (
                      <span className="text-red-400 italic text-sm">
                        {fieldError.password || errors.password}
                      </span>
                    ) : null}
                  </div>

                  {/* Referral */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#09431C]">
                      Referral Code (Optional)
                    </Label>
                    <Input
                      type="text"
                      name="referral"
                      placeholder="Input referral code"
                      value={values.referral}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500">
                      Using a referral code will give you bonus coupon and the
                      referrer will also receive points!
                    </p>
                    {(errors.referral && touched.referral) || fieldError.referral ? (
                      <span className="text-red-400 italic text-sm">
                        {fieldError.referral || errors.referral}
                      </span>
                    ) : null}
                  </div>

                  {/* Role */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#09431C]">Role</Label>
                    <Select
                      value={values.role}
                      onValueChange={(val) => setFieldValue("role", val)}
                    >
                      <SelectTrigger className="w-full rounded-lg border p-2">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="USER">
                            User - Buy tickets and earn points
                          </SelectItem>
                          <SelectItem value="ORGANIZER">
                            Organizer - Create and manage events
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {values.role === "USER"
                        ? "Users can buy event tickets, earn points, and use referral codes."
                        : values.role === "ORGANIZER"
                        ? "Organizers can create events, manage tickets, and earn from ticket sales."
                        : "Please select a role to continue."}
                    </p>
                    {(errors.role && touched.role) || fieldError.role ? (
                      <span className="text-red-400 italic text-sm">
                        {fieldError.role || errors.role}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col gap-0">
                  {error && (
                    <Label className="text-red-400 mb-4 font-normal italic">
                      {error}
                    </Label>
                  )}
                  {successMessage && (
                    <Label className="text-green-600 mb-4 font-normal italic">
                      {successMessage}
                    </Label>
                  )}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-2 bg-[#6FB229] hover:bg-[#09431C] rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>

        <div className="flex flex-col items-center md:flex-row justify-center mt-4">
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
