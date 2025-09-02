"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiCall } from "@/helper/axios";
import { getAuthData, clearAuthData } from "@/lib/auth-utils";

export default function AutoRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      console.log("🔄 AutoRedirect: Checking redirects...", { pathname });

      try {
        const { token, userData } = getAuthData();

        // Skip redirect for auth pages and event-organizer pages (handled by AuthGuard)
        if (
          pathname.startsWith("/signin") ||
          pathname.startsWith("/signup") ||
          pathname.startsWith("/verify") ||
          pathname.startsWith("/pre-verify") ||
          pathname.startsWith("/event-organizer")
        ) {
          console.log("🔄 AutoRedirect: Skipping redirect for this path");
          setIsChecking(false);
          return;
        }

        if (token && userData) {
          try {
            // Verify token with backend using /auth/keep endpoint
            console.log("🔄 AutoRedirect: Verifying token...");
            const response = await apiCall.get("/auth/keep");
            console.log("🔄 AutoRedirect: Token verified");

            // Get fresh user data from backend response
            const freshUserData = response.data?.data || userData;
            console.log("🔄 AutoRedirect: Fresh user data", {
              role: freshUserData.role,
              isVerified: freshUserData.is_verified,
              username: freshUserData.username,
            });

            // Update local storage with fresh data
            localStorage.setItem("user", JSON.stringify(freshUserData));

            // If user is verified, redirect based on role
            if (freshUserData.is_verified) {
              if (freshUserData.role === "ORGANIZER") {
                // Organizer should be redirected to event-organizer from main site
                if (!pathname.startsWith("/event-organizer")) {
                  console.log(
                    "🔄 AutoRedirect: Organizer detected, redirecting to /event-organizer"
                  );
                  router.replace("/event-organizer");
                  return;
                }
              } else {
                // Regular user can stay on main site
                console.log("🔄 AutoRedirect: User can stay on main site");
              }
            } else {
              // User not verified - only redirect to pre-verify if they're trying to access protected routes
              // Allow unverified users to browse main site
              if (pathname.startsWith("/event-organizer")) {
                console.log(
                  "🔄 AutoRedirect: User not verified, redirecting to /pre-verify"
                );
                router.replace("/pre-verify");
                return;
              } else {
                // Unverified user can browse main site
                console.log(
                  "🔄 AutoRedirect: Unverified user can browse main site"
                );
              }
            }
          } catch (error) {
            console.error("🔄 AutoRedirect: Token verification failed", error);
            // Token invalid, clear storage
            clearAuthData();

            // Redirect to signin if on protected route
            if (pathname.startsWith("/event-organizer")) {
              console.log("🔄 AutoRedirect: Redirecting to /signin");
              router.replace("/signin");
              return;
            }
          }
        } else {
          // No token, redirect to signin if on protected route
          if (pathname.startsWith("/event-organizer")) {
            console.log("🔄 AutoRedirect: No token, redirecting to /signin");
            router.replace("/signin");
            return;
          }
        }
      } catch (error) {
        console.error("🔄 AutoRedirect: Error during redirect check", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRedirect();
  }, [router, pathname]);

  // Show loading while checking
  if (isChecking) {
    console.log("🔄 AutoRedirect: Loading...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6FB229]"></div>
      </div>
    );
  }

  return null;
}
