import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const ADMIN_PREFIX = "/admin"
const STUDENT_PREFIX = "/student"

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })

  console.log("MIDDLEWARE — pathname:", req.nextUrl.pathname, "token:", token)

  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX)
  const isStudentRoute = pathname.startsWith(STUDENT_PREFIX)

  if (!token) {
    console.log("MIDDLEWARE — no token, redirecting to login")
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role
  const isAdminOrOwner = role === "ADMIN" || role === "OWNER"

  if (isAdminRoute && !isAdminOrOwner) {
    return NextResponse.redirect(new URL("/student/tutorials", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
}