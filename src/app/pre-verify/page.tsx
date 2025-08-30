"use client";

import { useEffect, useState } from "react";
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Card className="p-6 bg-white shadow-md text-center flex flex-col gap-4 rounded-3xl">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-[#09431C]">
              Account Registered Successfully!
            </h1>

            <div className="text-left space-y-3">
              <p className="text-gray-600">
                Welcome,{" "}
                <span className="font-semibold">{userData?.username}</span>!
                Your account has been created successfully.
              </p>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Email Verification Required
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  Please check your email at{" "}
                  <span className="font-semibold">{userData?.email}</span>
                  and click the verification link to activate your account.
                </p>
              </div>

              {userData?.referral_code && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-green-800">
                      Your Referral Code
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono text-green-700 border">
                      {userData.referral_code}
                    </code>
                    <Button
                      onClick={copyReferralCode}
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Share this code with friends to earn bonus points!
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Role:</strong>{" "}
                  {userData?.role === "USER"
                    ? "Event Attendee"
                    : "Event Organizer"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Account ID:</strong> {userData?.id}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                asChild
                className="w-full bg-[#6FB229] hover:bg-[#09431C]"
              >
                <Link href="/signin">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Sign In
                </Link>
              </Button>

              <p className="text-xs text-gray-500">
                After verifying your email, you can sign in and start using your
                account.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
