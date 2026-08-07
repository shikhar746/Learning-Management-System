import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().min(1, "Max marks must be greater than 0"),
  allowResubmission: z.boolean().optional().default(true),
  attachments: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(false),
})

export async function GET(req) {
  try {
    const session = await auth()
    const isAdminOrOwner =
      session?.user?.role === "ADMIN" || session?.user?.role === "OWNER"

    const whereClause = isAdminOrOwner
      ? { deletedAt: null }
      : { published: true, deletedAt: null }

    const assignments = await db.assignment.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

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
    const result = assignmentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      instructions,
      dueDate,
      maxMarks,
      allowResubmission,
      attachments,
      published,
    } = result.data

    const assignment = await db.assignment.create({
      data: {
        title,
        description,
        instructions,
        maxMarks,
        dueDate: dueDate ? new Date(dueDate) : null,
        allowResubmission: allowResubmission ?? true,
        attachments: attachments ?? [],
        published: published ?? false,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
