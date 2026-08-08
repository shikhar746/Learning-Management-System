import { NextResponse } from "next/server"
import { createAssignmentSchema } from "@/lib/validations/assignment"
import { getAssignments, createAssignment } from "@/services/assignmentService"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { authorizeWorkshopAccess, getFreshUserGlobalRole } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const workshopId = searchParams.get("workshopId")

    let userObject = null

    if (session?.user) {
      const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)

      if (workshopId) {
        const authResult = await authorizeWorkshopAccess(
          session.user.id,
          userGlobalRole,
          workshopId,
          ["STUDENT", "ADMIN", "OWNER"]
        )

        if (!authResult.authorized) {
          return NextResponse.json({ error: "Forbidden: Access restricted for this workshop" }, { status: 403 })
        }
      }

      userObject = {
        id: session.user.id,
        role: userGlobalRole,
      }
    }

    const assignments = await getAssignments(userObject, workshopId)
    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Fetch assignments error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignments" },
      { status: 400 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result = createAssignmentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { workshopId } = result.data
    const userGlobalRole = await getFreshUserGlobalRole(session.user.id, session.user.role)

    // Check per-workshop UserRole permissions
    if (workshopId) {
      const authResult = await authorizeWorkshopAccess(
        session.user.id,
        userGlobalRole,
        workshopId,
        ["ADMIN", "OWNER"]
      )

      if (!authResult.authorized) {
        return NextResponse.json({ error: "Forbidden: Admin access required for this workshop" }, { status: 403 })
      }
    } else {
      if (userGlobalRole !== "ADMIN" && userGlobalRole !== "OWNER") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
      }
    }

    const assignment = await createAssignment(result.data, session.user.id)
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create assignment" },
      { status: 500 }
    )
  }
}
