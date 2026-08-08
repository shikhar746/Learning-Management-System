import { NextResponse } from "next/server"
import { createAssignmentSchema } from "@/lib/validations/assignment"
import { getAssignments, createAssignment } from "@/services/assignmentService"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    const isAdminOrOwner =
      session?.user?.role === "ADMIN" || session?.user?.role === "OWNER"

    const assignments = await getAssignments(isAdminOrOwner)
    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Fetch assignments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const result = createAssignmentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const assignment = await createAssignment(result.data, session.user.id)
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
