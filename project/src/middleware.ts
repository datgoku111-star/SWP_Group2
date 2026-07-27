import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Paths that do not require authentication
const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/hsrm-login",
  "/hsrm-register",
  "/about",
  "/contact",
  "/blog",
  "/rooms",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/rooms",
  "/api/services",
];

// Paths that match multi-listing templates (we treat these as public)
const templatePaths = [
  "/home-2",
  "/home-3",
  "/listing-stay",
  "/listing-stay-detail",
  "/listing-car",
  "/listing-car-detail",
  "/listing-experiences",
  "/listing-experiences-detail",
  "/listing-real-estate",
  "/listing-flights",
  "/add-listing",
  "/checkout",
  "/pay-done",
  "/author",
  "/subscription"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Smart Role Redirect for staff accessing root or login pages while authenticated
  const initialToken = request.cookies.get("auth_token")?.value;
  if (initialToken && (pathname === "/" || pathname === "/login" || pathname === "/hsrm-login" || pathname === "/signup")) {
    const payload = await verifyToken(initialToken);
    if (payload && payload.role && payload.role !== "CUSTOMER") {
      if (payload.role === "RECEPTIONIST") {
        return NextResponse.redirect(new URL("/dashboard/receptionist", request.url));
      }
      if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (payload.role === "HOUSEKEEPING") {
        return NextResponse.redirect(new URL("/housekeeping", request.url));
      }
      if (payload.role === "KITCHEN") {
        return NextResponse.redirect(new URL("/orders", request.url));
      }
    }
  }

  // 1. Allow public paths and template paths
  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    templatePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") || // Next.js assets
    pathname.match(/\.(.*)$/) // Static files
  ) {
    return NextResponse.next();
  }

  // 2. Check for auth token
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/hsrm-login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // 3. Verify token
  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      response.cookies.delete("auth_token");
      return response;
    }
    const url = new URL("/hsrm-login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    // Also clear the invalid cookie
    const response = NextResponse.redirect(url);
    response.cookies.delete("auth_token");
    return response;
  }

  // 4. Role-based access control
  if (
    pathname.startsWith("/admin") &&
    payload.role !== "ADMIN" &&
    !pathname.startsWith("/admin/incidents/create") &&
    !pathname.startsWith("/admin/lost-found/create")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/housekeeping") && !["ADMIN", "HOUSEKEEPING"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/checkin") && !["ADMIN", "RECEPTIONIST"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/orders") && !["ADMIN", "KITCHEN", "RECEPTIONIST"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/car-orders") && !["ADMIN", "RECEPTIONIST"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/laundry-orders") && !["ADMIN", "RECEPTIONIST", "HOUSEKEEPING"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/car-bookings") && !["ADMIN", "CUSTOMER"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/laundry-bookings") && !["ADMIN", "CUSTOMER"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Pass user info via headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.sub);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-user-email", payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
