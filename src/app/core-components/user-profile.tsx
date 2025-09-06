"use client";

/**
 * UserButton Component
 *
 * This component handles user authentication and displays user information including points.
 * It uses axios to fetch fresh data from the backend and keeps the data synchronized.
 *
 * Features:
 * - Automatic data refresh every 30 seconds
 * - Manual refresh button
 * - Loading states
 * - Error handling with fallback to localStorage
 * - Token expiration handling
 * - Points synchronization with backend
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiCall } from "@/helper/axios";
import { getAuthData, clearAuthData } from "@/lib/auth-utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Settings, RefreshCw } from "lucide-react";

interface UserButtonData {
  username: string;
  referral_code: string | null;
  points: number;
  profile_pic?: string | null;
}

const UserButton: React.FC = () => {
  const [user, setUser] = useState<UserButtonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const getProfilePicUrl = (pic: string | null | undefined) => {
    if (!pic)
      return "https://i.pinimg.com/736x/1c/c5/35/1cc535901e32f18db87fa5e340a18aff.jpg";
    if (pic.startsWith("http")) return pic;
    return `https://event-management-api-sigma.vercel.app/${pic}`;
  };

  const fetchUserData = async (showLoading = true) => {
    try {
      const { token } = getAuthData();
      if (!token) {
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      // Try to fetch from backend, but fallback to local data if endpoint not available
      try {
        const res = await apiCall.get("/auth/keep");
        const userData = res.data?.data || res.data;

        if (!userData) {
          throw new Error("User data not found");
        }

        const userInfo: UserButtonData = {
          username: userData.username || userData.email || "User",
          referral_code: userData.referral_code || null,
          points: typeof userData.points === "number" ? userData.points : 0,
          profile_pic: userData.profile_pic || null,
        };

        // Update localStorage with fresh data
        const { userData: currentUserData } = getAuthData();
        if (currentUserData) {
          const updatedUserData = { ...currentUserData, ...userInfo };
          localStorage.setItem("user", JSON.stringify(updatedUserData));
        }

        setUser(userInfo);
        console.log("User data refreshed successfully:", userInfo);
      } catch (error: any) {
        console.log("Backend profile fetch failed, using local data", {
          status: error.response?.status,
          message: error.message,
        });

        // If endpoint not found (404), use local data
        if (error.response?.status === 404) {
          const { userData } = getAuthData();
          if (userData) {
            const userInfo: UserButtonData = {
              username: userData.username || userData.email || "User",
              referral_code: userData.referral_code || null,
              points: userData.points ?? 0,
              profile_pic: userData.profile_pic || null,
            };
            setUser(userInfo);
            console.log("Using local user data:", userInfo);
          }
          return;
        }

        // For other errors, handle them
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Token expired or invalid, redirecting to login");
          clearAuthData();
          router.push("/signin");
          return;
        }

        // Fallback to localStorage for any other error
        const { userData } = getAuthData();
        if (userData) {
          const userInfo: UserButtonData = {
            username: userData.username || userData.email || "User",
            referral_code: userData.referral_code || null,
            points: userData.points ?? 0,
            profile_pic: userData.profile_pic || null,
          };
          setUser(userInfo);
          console.log("Using fallback local data:", userInfo);
        }
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data manually
  const refreshUserData = async () => {
    setRefreshing(true);
    try {
      await fetchUserData(false);
      console.log("Data refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const { token } = getAuthData();
    if (token) {
      fetchUserData();

      // Set up polling to refresh user data every 30 seconds
      const interval = setInterval(() => {
        const { token: currentToken } = getAuthData();
        if (currentToken) {
          fetchUserData(false);
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    } else {
      // No token, show sign in button
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    clearAuthData();
    router.push("/");
    window.location.reload();
  };

  // Show loading state
  if (loading) {
    return (
      <Button variant="outline" className="rounded-full px-5" disabled>
        Loading...
      </Button>
    );
  }

  // Show sign in button if no user
  if (!user) {
    // Try to get user data from localStorage as fallback
    const { userData } = getAuthData();
    if (userData) {
      try {
        const fallbackUser: UserButtonData = {
          username: userData.username || userData.email || "User",
          referral_code: userData.referral_code || null,
          points: typeof userData.points === "number" ? userData.points : 0,
          profile_pic: userData.profile_pic || null,
        };
        setUser(fallbackUser);
        return null; // Let the component re-render with user data
      } catch (e) {
        console.error("Error parsing stored user data:", e);
      }
    }

    return (
      <Button
        asChild
        className="rounded-full px-5 bg-[#6FB229] hover:bg-[#09431C]"
      >
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          className="flex items-center gap-2 rounded-full pl-2 pr-3 h-10 w-20 md:w-35 hover:shadow-lg transition duration-500"
        >
          <img
            src={getProfilePicUrl(user.profile_pic)}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-border shadow-sm"
          />
          <span className="max-w-[120px] truncate text-sm font-medium">
            {user.username}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-3 flex items-center gap-3">
          <img
            src={getProfilePicUrl(user.profile_pic)}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover ring-1 ring-border shadow-sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">
              Ref: {user.referral_code ?? "-"}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Points</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-green-600">
                {user.points.toLocaleString()}
              </p>
              {refreshing && (
                <RefreshCw className="size-3 text-green-600 animate-spin" />
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Menu
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={refreshUserData}
          className="flex items-center cursor-pointer"
          disabled={refreshing}
        >
          <RefreshCw
            className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/edit-profile"
            className="flex items-center cursor-pointer"
          >
            <Settings className="size-4 mr-2" /> Edit Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="size-4 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
