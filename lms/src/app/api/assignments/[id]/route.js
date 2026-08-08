import { NextResponse } from "next/server"
import { updateAssignmentSchema } from "@/lib/validations/assignment"
import { getAssignmentById, updateAssignment, deleteAssignment } from "@/services/assignmentService"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    let isAdminOrOwner = false
    let userId = session?.user?.id

    if (session?.user) {
      const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      const role = dbUser?.role || session.user.role
      isAdminOrOwner = role === "ADMIN" || role === "OWNER"
    }

    const assignment = await getAssignmentById(id, userId, isAdminOrOwner)

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found or restricted" }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("Get assignment error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignment" },
      { status: 400 }
    )
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
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
      { error: error.message || "Failed to update assignment" },
      { status: 400 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    await deleteAssignment(id)
    return NextResponse.json({ message: "Assignment deleted successfully" })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete assignment" },
      { status: 400 }
    )
  }
}
