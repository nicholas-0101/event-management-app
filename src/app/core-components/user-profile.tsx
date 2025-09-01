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
    if (!pic) return "/avatar-placeholder.png";
    if (pic.startsWith("http")) return pic;
    return `http://localhost:4400/${pic}`;
  };

  const fetchUserData = async (showLoading = true) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      // Fetch fresh data from backend
      const response = await apiCall.get("/auth/keep");
      const userData = response.data.data || response.data;

      const userInfo: UserButtonData = {
        username: userData.username || userData.email || "User",
        referral_code: userData.referral_code || null,
        points: typeof userData.points === "number" ? userData.points : 0,
        profile_pic: userData.profile_pic || null,
      };

      // Update localStorage with fresh data
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userInfo);

      // Log success for debugging
      console.log("User data refreshed successfully:", userInfo);
    } catch (error: any) {
      console.error("Error fetching user data:", error);

      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token expired or invalid
        console.log("Token expired or invalid, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/signin");
        return;
      }

      if (error.response?.status === 404) {
        console.log("Endpoint not found, using localStorage data");
        // Fallback to localStorage if endpoint not found
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            username: parsedUser.username,
            referral_code: parsedUser.referral_code,
            points: parsedUser.points ?? 0,
            profile_pic: parsedUser.profile_pic ?? null,
          });
        }
        return;
      }

      // Fallback to localStorage for any other error
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          username: parsedUser.username,
          referral_code: parsedUser.referral_code,
          points: parsedUser.points ?? 0,
          profile_pic: parsedUser.profile_pic ?? null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data manually
  const refreshUserData = async () => {
    setRefreshing(true);
    try {
      await fetchUserData(false);
      // Show success notification
      console.log("Data refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData();

      // Set up polling to refresh user data every 30 seconds
      const interval = setInterval(() => {
        const currentToken = localStorage.getItem("token");
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/signin");
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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const fallbackUser: UserButtonData = {
          username: parsedUser.username || parsedUser.email || "User",
          referral_code: parsedUser.referral_code || null,
          points: typeof parsedUser.points === "number" ? parsedUser.points : 0,
          profile_pic: parsedUser.profile_pic || null,
        };
        setUser(fallbackUser);
        return null; // Let the component re-render with user data
      } catch (e) {
        console.error("Error parsing stored user data:", e);
      }
    }

    return (
      <Button asChild className="rounded-full px-5">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          className="flex items-center gap-2 rounded-full pl-2 pr-3 h-10"
        >
          <img
            src={getProfilePicUrl(user.profile_pic)}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
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
            className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
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
