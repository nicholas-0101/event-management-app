"use client";

import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MobileNotSupported() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-[#c6ee9a] rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-[#00481a]" />
          </div>
          <h1 className="text-2xl font-bold text-[#00481a] mb-2">
            Mobile Not Supported
          </h1>
          <p className="text-gray-600">
            The Event Organizer Dashboard is designed for desktop use only.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
            <Monitor className="w-5 h-5 text-[#97d753]" />
            <span>Please use a desktop computer or laptop</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
            <Smartphone className="w-5 h-5 text-[#00481a]" />
            <span>Mobile devices are not supported</span>
          </div>
        </div>

        <div className="bg-[#c6ee9a] rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-[#00481a] mb-2">
            Why Desktop Only?
          </h3>
          <p className="text-sm text-[#00481a]">
            The Event Organizer Dashboard contains complex features like event
            management, attendee tracking, and detailed analytics that require a
            larger screen and precise controls for optimal user experience.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/event-organizer"
            className="w-full bg-[#00481a] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#97d753] hover:text-[#00481a] transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event Organizer</span>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team at{" "}
            <a
              href="mailto:support@ticketnest.com"
              className="text-[#00481a] hover:underline"
            >
              support@ticketnest.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
