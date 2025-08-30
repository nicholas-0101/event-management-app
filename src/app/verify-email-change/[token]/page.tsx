"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiCall } from "@/helper/axios";
import Link from "next/link";

export default function VerifyEmailChangePage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");

  const handleVerifyEmailChange = async () => {
    try {
      const token = params.token as string;
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      setStatus("loading");

      const response = await apiCall.get(
        `/profile/verify-email-change?token=${token}`
      );

      console.log("Response from verify email change:", response.data);

      if (response.status === 200 && response.data.success) {
        setStatus("success");
        setMessage(response.data.message || "Email changed successfully!");
        setNewEmail(response.data.newEmail || "");
      } else {
        throw new Error(response.data.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Error verifying email change:", error);
      setStatus("error");

      // Handle different types of errors
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.message) {
        setMessage(error.message);
      } else if (error.response?.status === 400) {
        setMessage(
          "Invalid or expired verification link. Please request a new one."
        );
      } else if (error.response?.status === 404) {
        setMessage("User not found. Please try again.");
      } else {
        setMessage(
          "Failed to verify email change. The link may be expired or invalid."
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Card className="p-6 bg-white shadow-md text-center flex flex-col gap-2 rounded-3xl">
            <h1 className="text-2xl font-bold mb-2 text-[#09431C]">
              Verify Email Change
            </h1>
            <p
              className={`mb-4 ${
                status === "success"
                  ? "text-green-600"
                  : status === "error"
                  ? "text-red-400"
                  : "text-gray-600"
              }`}
            >
              {status === "idle" &&
                "Click the button below to verify your email change"}
              {status === "loading" && "Verifying your email change..."}
              {(status === "success" || status === "error") && message}
            </p>

            {status === "idle" && (
              <Button
                onClick={handleVerifyEmailChange}
                className="w-full rounded-lg bg-[#6FB229] hover:bg-[#09431C] cursor-pointer"
              >
                Verify Email Change
              </Button>
            )}

            {status === "loading" && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-2">Verifying...</span>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                {newEmail && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      Your email has been changed to:{" "}
                      <strong>{newEmail}</strong>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full rounded-lg bg-[#6FB229] hover:bg-[#09431C]"
                  >
                    <Link href="/signin">Sign In with New Email</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Go to Home</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full rounded-lg bg-[#6FB229] hover:bg-[#09431C]"
                  >
                    <Link href="/edit-profile">Try Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Go to Home</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
