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
    try {
      const response = await apiCall.post("/auth/signup", values);
      if (response.status === 200 || response.status === 201) {
        console.log("Signup successful:", response.data);
        router.replace("/pre-verify");
      } else {
        console.error("Signup failed:", response.status, response.data);
        setError(JSON.stringify(response.data.errors, null, 2));
      }
    } catch (error: any) {
      console.error("Error during signup:", error);
      setError(error.message || "An unknown error occurred during signup. Please try again.");
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
                    <Label className="text-[#09431C]">Referral Code</Label>
                    <Input
                      type="text"
                      name="referral"
                      placeholder="Input referral code"
                      value={values.referral}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                    />
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
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="ORGANIZER">Organizer</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.role && touched.role && (
                      <span className="text-red-400 italic text-sm">
                        {errors.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col gap-0">
                  <Label className="text-red-400 mb-4 font-normal italic">
                    {error}
                  </Label>
                  <Button
                    type="submit"
                    className="w-full p-2 bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
                  >
                    Sign Up
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
