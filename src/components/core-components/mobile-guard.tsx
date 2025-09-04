"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MobileGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function MobileGuard({
  children,
  redirectTo = "/mobile-not-supported",
}: MobileGuardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /mobile|android|iphone|ipad|phone|blackberry|opera mini|windows phone/i.test(
          userAgent
        );

      // Check screen width as additional measure
      const isSmallScreen = window.innerWidth < 768;

      setIsMobile(isMobileDevice || isSmallScreen);
      setIsLoading(false);
    };

    checkDevice();

    // Add resize listener for responsive behavior
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isSmallScreen);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading && isMobile) {
      router.push(redirectTo);
    }
  }, [isMobile, isLoading, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking device compatibility...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return null; // Will redirect to mobile-not-supported page
  }

  return <>{children}</>;
}
