"use client";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UserButton from "./user-profile";

export default function Navbar() {
  const pathname = usePathname();

  // list of routes where navbar should be hidden
  const hiddenRoutes = ["/signin", "/signup", "/verify", "/pre-verify"];
  const hideNavbar = hiddenRoutes.some((route) => pathname.startsWith(route));
  if (hideNavbar) {
    return null;
  }

  return (
    <nav className="relative top-0 w-full h-20 pt-4 bg-white">
      <div className="flex items-center justify-between h-full">
        {/* logo */}
        <Link href={"/"}>
          <img src="TicketNest-nobg.png" className="h-10 w-auto" />
        </Link>

        {/* links */}
        <div className="flex gap-10 items-center">
          <Link href="/explore">
            <Button variant="link" className="cursor-pointer p-0">
              Explore
            </Button>
          </Link>
          <Link href="/transaction-history">
            <Button variant="link" className="cursor-pointer p-0">
              My Tickets
            </Button>
          </Link>

          {/* User button */}
          <div className="flex gap-2">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
