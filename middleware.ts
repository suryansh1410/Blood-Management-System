import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /donor, /patient, /admin routes
  const isDonorRoute = pathname.startsWith("/donor");
  const isPatientRoute = pathname.startsWith("/patient");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isDonorRoute && !isPatientRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "bms-super-secret-jwt-key-for-blood-bank-system-2026",
  });

  // If not logged in, redirect to login with callbackUrl
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const userRole = (token.role as string)?.toUpperCase();

  // Role authorization
  if (isDonorRoute && userRole !== "DONOR") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (isPatientRoute && userRole !== "PATIENT") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/donor/:path*", "/patient/:path*", "/admin/:path*"],
};
