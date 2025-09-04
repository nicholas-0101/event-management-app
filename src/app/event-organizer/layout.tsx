import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "../globals.css";
import AuthGuard from "@/components/core-components/auth-guard";
import ViewportGuard from "@/components/core-components/viewport-guard";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "900"],
});

export const metadata: Metadata = {
  title: "TicketNest Event Organizer",
  description: "Event Organizer Dashboard",
};

export default function EventOrganizerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard
      requiredRole="ORGANIZER"
      redirectTo="/"
      requireVerification={false}
    >
      {/* client-only guard; renders nothing */}
      <ViewportGuard />
      <div className="px-36">
        <div className="pt-4 pb-15">{children}</div>
      </div>
    </AuthGuard>
  );
}
