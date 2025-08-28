"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiCall } from "@/helper/axios";

export default function VerifyPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

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
          </Card>
        </div>
      </main>
    </div>
  );
}
