"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

interface UserData {
  id: number;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  referral_code: string;
}

export default function PreVerifyPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    // Get user data from localStorage
    const tempUserData = localStorage.getItem("tempUserData");
    if (tempUserData) {
      try {
        const parsed = JSON.parse(tempUserData);
        setUserData(parsed);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const copyReferralCode = () => {
    if (userData?.referral_code) {
      navigator.clipboard.writeText(userData.referral_code);
      alert("Referral code copied to clipboard!");
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Card className="p-6 bg-white shadow-md text-center flex flex-col gap-4 rounded-3xl">
            <h1 className="text-2xl font-bold text-[#09431C]">
              Account Registered!
            </h1>

            <div className="text-center space-y-3">
              <p className="text-gray-600">
                Please check your email for verification
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
