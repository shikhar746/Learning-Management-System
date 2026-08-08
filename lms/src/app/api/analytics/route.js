import { NextResponse } from "next/server"
import { getAdminAnalytics, getStudentAnalytics } from "@/services/analyticsService"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdminOrOwner =
      session.user.role === "ADMIN" || session.user.role === "OWNER"

    const data = isAdminOrOwner
      ? await getAdminAnalytics()
      : await getStudentAnalytics(session.user.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
