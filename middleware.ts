import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mobile redirect for event-organizer routes
  if (pathname.startsWith("/event-organizer")) {
    const ua = request.headers.get("user-agent")?.toLowerCase() || "";
    // Client Hints: Chromium akan mengirimkan Sec-CH-UA-Mobile=?1 untuk mobile (jika tersedia)
    const chMobile = request.headers.get("sec-ch-ua-mobile")?.toLowerCase();
    const isClientHintsMobile = chMobile === "?1" || chMobile === "1";

    // Perluas deteksi UA untuk menangkap tablet/desktop-mode iPad dan varian lain
    const isUaMobile =
      /\b(mobi|mobile|android|iphone|ipod|ipad|phone|blackberry|opera mini|windows phone|tablet)\b/.test(
        ua
      );

    // Beberapa iPadOS dalam mode desktop memiliki UA mirip Mac tetapi tetap sentuh
    // Deteksi konservatif: jika mengandung "mac os x" dan "ipad" tidak ada, jangan paksa mobile
    const looksLikeDesktopMac =
      ua.includes("macintosh") || ua.includes("mac os x");
    const explicitlyIPad = ua.includes("ipad");

    const isMobile =
      isClientHintsMobile ||
      isUaMobile ||
      (explicitlyIPad && !looksLikeDesktopMac);

    if (isMobile) {
      const redirectResponse = NextResponse.redirect(
        new URL("/mobile-not-supported", request.url)
      );
      // Pastikan cache CDN membedakan mobile vs desktop
      redirectResponse.headers.set("Vary", "User-Agent, Sec-CH-UA-Mobile");
      return redirectResponse;
    }
  }

  // Get token and user data from cookies or headers
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // If no token, allow access to public routes
  if (!token) {
    // Redirect to signin if trying to access protected routes
    if (
      pathname.startsWith("/event-organizer") ||
      pathname.startsWith("/transaction-history") ||
      pathname.startsWith("/edit-profile")
    ) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  // If token exists, check user role and redirect accordingly
  try {
    // Try to get user data from cookies
    const userDataCookie = request.cookies.get("user")?.value;
    if (userDataCookie) {
      const userData = JSON.parse(userDataCookie);

      // If user is organizer, redirect to event-organizer from main site
      if (
        userData.role === "ORGANIZER" &&
        !pathname.startsWith("/event-organizer")
      ) {
        return NextResponse.redirect(new URL("/event-organizer", request.url));
      }

      // If user is regular user and trying to access event-organizer, redirect to main site
      if (userData.role === "USER" && pathname.startsWith("/event-organizer")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  } catch (error) {
    console.error("Error parsing user data in middleware:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
