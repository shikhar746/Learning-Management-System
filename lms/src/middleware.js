import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const ADMIN_PREFIX = "/admin"
const STUDENT_PREFIX = "/student"

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })

  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX)
  const isStudentRoute = pathname.startsWith(STUDENT_PREFIX)

  // Not signed in at all — bounce to login for any protected route.
  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role
  const isAdminOrOwner = role === "ADMIN" || role === "OWNER"

  // Signed in, but a STUDENT trying to reach an admin-only route.
  if (isAdminRoute && !isAdminOrOwner) {
    return NextResponse.redirect(new URL("/student/tutorials", req.url))
  }

  // Signed in as an admin hitting a student-only route is allowed through
  // deliberately — admins are a superset, not a separate silo, and may
  // need to view student-facing pages (e.g. previewing a tutorial).
  // No redirect needed for that case.

  return NextResponse.next()
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
}