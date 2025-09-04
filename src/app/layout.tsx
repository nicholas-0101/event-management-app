import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./core-components/navbar";
import Footer from "./core-components/footer";
import AutoRedirect from "@/components/core-components/auto-redirect";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "TicketNest",
  description: "Simplify Your Event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <AutoRedirect />
        <div className="px-4 sm:px-10 md:px-20 lg:px-36">
          <Navbar />
          <div className="pt-4 pb-15">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
