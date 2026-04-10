"use client";

import EditProfile from "@/app/edit-profile/page";
import { Settings } from "lucide-react";

export default function OrganizerEditProfilePage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-2xl mt-8 mb-8">
        <div className="px-6 py-7">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#c6ee9a]/40 rounded-xl">
              <Settings className="w-6 h-6 text-[#09431C]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#09431C]">Edit Profile</h1>
              <p className="text-gray-500 text-base mt-0.5">
                Manage your account information and security settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile form — reuse the shared component, standalone=false since we provide our own wrapper */}
      <EditProfile standalone={false} />
    </div>
  );
}
