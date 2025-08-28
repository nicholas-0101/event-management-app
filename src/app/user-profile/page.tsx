"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";

interface UserButtonData {
  username: string;
  referral_code: string | null;
  points: number;
  profile_pic?: string | null;
}

const UserButton: React.FC = () => {
  const [user, setUser] = useState<UserButtonData | null>(null);
  const router = useRouter();

  // helper untuk format URL gambar
  const getProfilePicUrl = (pic: string | null | undefined) => {
    if (!pic) return "/avatar-placeholder.png";
    if (pic.startsWith("http")) return pic;
    return `http://localhost:4400/${pic}`;
  };

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/signin");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!user) {
    return (
      <Button
        onClick={() => router.push("/signin")}
        className="rounded-full px-5"
      >
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full pl-2 pr-3 h-10 border-input/60 hover:shadow-sm"
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
            <p className="text-sm font-semibold text-green-600">
              {user.points}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Menu
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleNavigate("/user-profile")}>
          <UserIcon className="size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
