"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiCall } from "@/helper/axios";
import Link from "next/link";

export default function VerifyPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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

  const handleVerify = async () => {
    try {
      setStatus("loading");
      const res = await apiCall.get(`/auth/verify?token=${params.token}`);
      setMessage(res.data.message || "Account verified successfully");
      setStatus("success");
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.message || "Verification failed");
      setStatus("error");
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
    <div className="flex flex-col h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Card className="p-6 bg-white shadow-md text-center flex flex-col gap-2 rounded-3xl">
            <h1 className="text-2xl font-bold mb-2 text-[#09431C]">
              Verify your account
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
                "Click the button below to verify your account"}
              {status === "loading" && "Verifying your account..."}
              {(status === "success" || status === "error") && message}
            </p>

            {status === "idle" && (
              <Button
                onClick={handleVerify}
                className="w-full rounded-lg bg-[#6FB229] hover:bg-[#09431C] cursor-pointer"
              >
                Verify
              </Button>
            )}
            {status === "success" && (
              <a href="/signin">
                <Button className="w-full rounded-lg bg-[#6FB229] hover:bg-[#09431C] cursor-pointer">
                  Sign In
                </Button>
              </a>
            )}
            {status === "error" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full rounded-lg bg-[#6FB229] hover:bg-[#09431C]"
                  >
                    <Link href="/signup">Try Again</Link>
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
