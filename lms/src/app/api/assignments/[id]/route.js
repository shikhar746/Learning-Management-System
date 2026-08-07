import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  instructions: z.string().min(10).optional(),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().min(1).optional(),
  allowResubmission: z.boolean().optional(),
  attachments: z.array(z.string()).optional(),
  published: z.boolean().optional(),
})

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const session = await auth()

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!assignment || assignment.deletedAt) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const isAdminOrOwner =
      session?.user?.role === "ADMIN" || session?.user?.role === "OWNER"

    if (!assignment.published && !isAdminOrOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let userSubmissions = []
    if (session?.user?.id && !isAdminOrOwner) {
      userSubmissions = await db.submission.findMany({
        where: {
          assignmentId: id,
          userId: session.user.id,
          deletedAt: null,
        },
        orderBy: { version: "desc" },
      })
    }

    return NextResponse.json({
      ...assignment,
      userSubmissions,
    })
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
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const dataToUpdate = { ...result.data }
    if (dataToUpdate.dueDate !== undefined) {
      dataToUpdate.dueDate = dataToUpdate.dueDate
        ? new Date(dataToUpdate.dueDate)
        : null
    }

    const updatedAssignment = await db.assignment.update({
      where: { id },
      data: dataToUpdate,
    })

    return NextResponse.json(updatedAssignment)
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

    await db.assignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Assignment deleted successfully" })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
