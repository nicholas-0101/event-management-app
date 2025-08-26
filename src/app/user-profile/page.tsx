"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UserButtonData {
  username: string;
  referral_code: string | null;
  points: number;
  profile_pic?: string | null;
}

const UserButton: React.FC = () => {
  const [user, setUser] = useState<UserButtonData | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    // Tutup dropdown saat klik di luar
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/signin");
  };

  if (!user) {
    return (
      <Button
        onClick={() => router.push("/signin")}
        className="bg-[#6FB229] hover:bg-[#09431C] text-white rounded-lg px-4 py-2"
      >
        Login
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2"
      >
        <img
          src={user.profile_pic || "/avatar-placeholder.png"}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="font-semibold">{user.username}</span>
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4 flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="font-semibold">Referral Code:</span>
              <span className="text-blue-600">{user.referral_code ?? "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">Points:</span>
              <span className="text-green-600">{user.points}</span>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserButton;
