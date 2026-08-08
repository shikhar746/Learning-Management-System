import { NextResponse } from "next/server"
import { createAssignmentSchema } from "@/lib/validations/assignment"
import { getAssignments, createAssignment } from "@/services/assignmentService"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const workshopId = searchParams.get("workshopId")

    let userObject = null

    if (session?.user) {
      const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
      })
      userObject = dbUser || session.user
    }

    const assignments = await getAssignments(userObject, workshopId)
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const role = dbUser?.role || session.user.role

    if (role !== "ADMIN" && role !== "OWNER") {
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
