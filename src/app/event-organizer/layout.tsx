import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "../globals.css";
import AuthGuard from "@/components/core-components/auth-guard";
import ViewportGuard from "@/components/core-components/viewport-guard";
import SidebarLayout from "./core-components/sidebar-layout";

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
      <ViewportGuard />
      <SidebarLayout>{children}</SidebarLayout>
    </AuthGuard>
  );
}
