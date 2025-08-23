// pages: landing, signin, create event, transaction history, explore

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
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
            <Button variant="link" className="cursor-pointer p-0">Explore</Button>
          </Link>
          <Link href="/transaction-history">
            <Button variant="link" className="cursor-pointer p-0">My Tickets</Button>
          </Link>
          <Link href="/eo-organizer-dashboard">
            <Button variant="link" className="cursor-pointer p-0">Create Event</Button>
          </Link>
          <div className="flex gap-2">
            <Link href="/signin">
              <Button variant="link" className="cursor-pointer p-0">
                Sign In
              </Button>
            </Link>
            <Link href="/user-profile">
              <Button variant="link" className="cursor-pointer p-0">ProfilePic</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
