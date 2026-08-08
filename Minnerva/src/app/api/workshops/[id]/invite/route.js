import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { inviteAdminSchema } from "@/lib/validations/workshop"
import { inviteAdminToWorkshop, getWorkshopById } from "@/services/workshopService"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)

    const authResult = await authorizeWorkshopAccess(
      session.user.id,
      userGlobalRole,
      id,
      ["ADMIN", "OWNER"]
    )

    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required for this workshop" }, { status: 403 })
    }

    const workshop = await getWorkshopById(id, session.user.id)
    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const body = await req.json()
    const { email } = inviteAdminSchema.parse(body)

    const result = await inviteAdminToWorkshop(id, email, session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/workshops/[id]/invite error:", error)
    return NextResponse.json({ error: error.message || "Failed to invite admin" }, { status: 400 })
  }
}
