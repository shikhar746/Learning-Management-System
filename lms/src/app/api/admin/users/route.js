import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const currentRole = dbUser?.role || session.user.role
    if (currentRole !== "ADMIN" && currentRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Admin or Owner access required" }, { status: 403 })
    }

    let userWhere = {}

    // Regular Admins only see students enrolled in their own workshops/cohorts
    if (currentRole !== "OWNER") {
      const adminRoles = await db.userRole.findMany({
        where: { userId: session.user.id, role: { in: ["ADMIN", "OWNER"] } },
        select: { workshopId: true },
      })
      const adminWorkshopIds = adminRoles.map((r) => r.workshopId)

      userWhere = {
        OR: [
          { id: session.user.id }, // Self
          {
            workshopRoles: {
              some: {
                workshopId: { in: adminWorkshopIds },
              },
            },
          },
        ],
      }
    }

    const users = await db.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("GET /api/admin/users error:", error)
    return NextResponse.json({ error: "Failed to fetch user directory" }, { status: 500 })
  }
}
