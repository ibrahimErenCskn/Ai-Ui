import { NextRequest, NextResponse } from "next/server";
import authConfig from "./auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session;

  // Korumalı rotalar
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/create") ||
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/profile");

  // Giriş sayfasına erişim
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");

  // Kullanıcı giriş yapmamış ve korumalı bir sayfaya erişmeye çalışıyorsa
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    // Giriş yaptıktan sonra kullanıcıyı gitmek istediği sayfaya yönlendirmek için
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Kullanıcı giriş yapmış ve giriş sayfasına erişmeye çalışıyorsa
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

// Middleware'in çalışacağı rotaları belirle
export const config = {
  matcher: [
    "/create",
    "/create/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/login",
  ],
};
