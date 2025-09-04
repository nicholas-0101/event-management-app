"use client";

import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MobileNotSupported() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mobile Not Supported
          </h1>
          <p className="text-gray-600">
            The Event Organizer Dashboard is designed for desktop use only.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
            <Monitor className="w-5 h-5 text-blue-500" />
            <span>Please use a desktop computer or laptop</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
            <Smartphone className="w-5 h-5 text-red-500" />
            <span>Mobile devices are not supported</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Why Desktop Only?
          </h3>
          <p className="text-sm text-blue-800">
            The Event Organizer Dashboard contains complex features like event
            management, attendee tracking, and detailed analytics that require a
            larger screen and precise controls for optimal user experience.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/event-organizer"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
              className="text-blue-600 hover:underline"
            >
              support@ticketnest.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
