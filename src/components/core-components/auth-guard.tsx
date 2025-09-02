"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiCall } from "@/helper/axios";
import { getAuthData, clearAuthData, UserData } from "@/lib/auth-utils";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "USER" | "ORGANIZER";
  redirectTo?: string;
  requireVerification?: boolean;
}

export default function AuthGuard({
  children,
  requiredRole,
  redirectTo,
  requireVerification = true,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔒 AuthGuard: Checking authentication...", {
        pathname,
        requiredRole,
        requireVerification,
      });

      try {
        const { token, userData } = getAuthData();
        console.log("🔒 AuthGuard: Auth data retrieved", {
          hasToken: !!token,
          hasUserData: !!userData,
        });

        if (!token || !userData) {
          console.log(
            "🔒 AuthGuard: No token or user data, redirecting to signin"
          );
          if (pathname !== "/signin" && pathname !== "/signup") {
            router.replace("/signin");
          }
          setIsLoading(false);
          return;
        }

        console.log("🔒 AuthGuard: User data", {
          role: userData.role,
          isVerified: userData.is_verified,
          username: userData.username,
        });

        // Check verification status first
        if (requireVerification && !userData.is_verified) {
          console.log(
            "🔒 AuthGuard: User not verified, redirecting to pre-verify"
          );
          router.replace("/pre-verify");
          return;
        }

        // Try to verify token with backend, but fallback to local data if endpoint not available
        let tokenVerified = false;
        try {
          console.log("🔒 AuthGuard: Verifying token with backend...");
          // Use /auth/keep endpoint to verify token and get fresh user data
          const response = await apiCall.get("/auth/keep");
          console.log("🔒 AuthGuard: Token verified successfully");

          // Update local data with fresh data from backend
          if (response.data?.data) {
            const freshUserData = response.data.data;
            // Update localStorage with fresh data
            localStorage.setItem("user", JSON.stringify(freshUserData));
            // Update state with fresh data
            setUser(freshUserData);
          } else {
            setUser(userData);
          }

          tokenVerified = true;
        } catch (error: any) {
          console.log(
            "🔒 AuthGuard: Backend verification failed, using local data",
            {
              status: error.response?.status,
              message: error.message,
            }
          );

          // If it's a 404 (endpoint not found), we can still proceed with local data
          if (error.response?.status === 404) {
            console.log(
              "🔒 AuthGuard: Endpoint not found, proceeding with local data"
            );
            setUser(userData);
            tokenVerified = true; // Treat as verified for now
          } else {
            // For other errors (401, 403, etc.), clear storage and redirect
            console.error("🔒 AuthGuard: Token verification failed", error);
            clearAuthData();
            router.replace("/signin");
            return;
          }
        }

        if (tokenVerified) {
          // Check if required role is specified and user has it
          const currentUser = user || userData;
          if (requiredRole && currentUser.role !== requiredRole) {
            console.log(
              `🔒 AuthGuard: Role mismatch. Required: ${requiredRole}, User: ${currentUser.role}`
            );
            if (redirectTo) {
              console.log(`🔒 AuthGuard: Redirecting to ${redirectTo}`);
              router.replace(redirectTo);
            } else if (currentUser.role === "ORGANIZER") {
              console.log(
                "🔒 AuthGuard: Redirecting organizer to /event-organizer"
              );
              router.replace("/event-organizer");
            } else {
              console.log("🔒 AuthGuard: Redirecting user to /");
              router.replace("/");
            }
            return;
          }

          console.log(
            "🔒 AuthGuard: Authentication successful, rendering children"
          );
        }
      } catch (error) {
        console.error("🔒 AuthGuard: Auth check error", error);
        clearAuthData();
        router.replace("/signin");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, requiredRole, redirectTo, requireVerification]);

  // Show loading while checking auth
  if (isLoading) {
    console.log("🔒 AuthGuard: Loading...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6FB229]"></div>
      </div>
    );
  }

  // If no user or user doesn't have required role, don't render children
  if (!user || (requiredRole && user.role !== requiredRole)) {
    console.log("🔒 AuthGuard: Access denied", {
      user: !!user,
      role: user?.role,
      requiredRole,
    });
    return null;
  }

  console.log("🔒 AuthGuard: Access granted, rendering children");
  return <>{children}</>;
}
