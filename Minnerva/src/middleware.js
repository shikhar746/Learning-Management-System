import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const ADMIN_PREFIX = "/admin"
const STUDENT_PREFIX = "/student"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX)
  const isStudentRoute = pathname.startsWith(STUDENT_PREFIX)

  if (!session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role
  const isAdminOrOwner = role === "ADMIN" || role === "OWNER"

  if (isAdminRoute && !isAdminOrOwner) {
    return NextResponse.redirect(new URL("/student", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
}