"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ViewportGuard() {
  const router = useRouter();

  useEffect(() => {
    const handleCheck = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        router.replace("/mobile-not-supported");
      }
    };

    // initial check
    handleCheck();

    // listen for resize to catch changes
    window.addEventListener("resize", handleCheck);
    return () => window.removeEventListener("resize", handleCheck);
  }, [router]);

  return null;
}
