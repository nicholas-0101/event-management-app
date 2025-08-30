// src/pages/signup.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const router = useRouter();

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

      // Handle different types of errors
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError("Invalid data provided. Please check your input.");
      } else if (error.response?.status === 409) {
        setError(
          "Email or username already exists. Please try a different one."
        );
      } else {
        setError("An error occurred during signup. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                    {errors.username && touched.username && (
                      <span className="text-red-400 italic text-sm">
                        {errors.username}
                      </span>
                    )}
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
                        variant={"ghost"}
                      >
                        {showPassword ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )}
                      </Button>
                    </div>
                    {errors.password && touched.password && (
                      <span className="text-red-400 italic text-sm">
                        {errors.password}
                      </span>
                    )}
                  </div>

                  {/* Referral */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#09431C]">
                      Referral Code (Optional)
                    </Label>
                    <Input
                      type="text"
                      name="referral"
                      placeholder="Input referral code to get bonus points"
                      value={values.referral}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500">
                      Using a referral code will give you bonus points and the
                      referrer will also receive points!
                    </p>
                    {errors.referral && touched.referral && (
                      <span className="text-red-400 italic text-sm">
                        {errors.referral}
                      </span>
                    )}
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
                    {errors.role && touched.role && (
                      <span className="text-red-400 italic text-sm">
                        {errors.role}
                      </span>
                    )}
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
                    className="w-full p-2 bg-[#6FB229] hover:bg-[#09431C] rounded-lg disabled:opacity-50"
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>

        <div className="flex justify-center mt-4">
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
