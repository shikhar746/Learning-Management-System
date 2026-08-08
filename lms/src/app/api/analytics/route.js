import { NextResponse } from "next/server"
import { getAdminAnalytics, getStudentAnalytics } from "@/services/analyticsService"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check fresh role from DB
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const role = dbUser?.role || session.user.role
    const isAdminOrOwner = role === "ADMIN" || role === "OWNER"

    const data = isAdminOrOwner
      ? await getAdminAnalytics(session.user.id, role)
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
