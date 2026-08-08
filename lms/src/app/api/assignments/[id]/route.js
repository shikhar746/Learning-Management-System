import { NextResponse } from "next/server"
import { updateAssignmentSchema } from "@/lib/validations/assignment"
import { getAssignmentById, updateAssignment, deleteAssignment } from "@/services/assignmentService"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    const isAdminOrOwner =
      session?.user?.role === "ADMIN" || session?.user?.role === "OWNER"

    const assignment = await getAssignmentById(id, session?.user?.id, isAdminOrOwner)

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("Get assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const result = updateAssignmentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const updated = await updateAssignment(id, result.data)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await deleteAssignment(id)
    return NextResponse.json({ message: "Assignment deleted successfully" })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
