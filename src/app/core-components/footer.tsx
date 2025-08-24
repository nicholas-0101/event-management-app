"use client";

import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import Link from "next/link";
export default function Footer() {
  return (
    <footer className="w-full text-neutral-600 pb-10">
      <hr className="my-8 border-t-2 border-gray-600 w-full mx-0" />
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
       
        <div>
          <Link href={"/"}>
            <img
              src="/TicketNest-nobg.png"
              alt="TicketNest"
              className="h-12 mb-4"
            />
          </Link>
          <p className="text-sm text-black">
            TicketNest is your trusted platform for booking tickets to concerts,
            sports, theaters, and festivals with ease.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/explore" className="hover:underline">
                Events
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col md:items-end">
          <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#00481a]">
              <FaFacebook size={32}/>
            </a>
            <a href="#" className="hover:text-[#00481a]">
              <FaInstagram size={32}/>
            </a>
            <a href="#" className="hover:text-[#00481a]">
              <FaTwitter size={32}/>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 mt-10 pt-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} TicketNest. All rights reserved.
      </div>
    </footer>
  );
}